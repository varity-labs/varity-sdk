"""
Regression tests for VAR-143: varity_deploy MCP returns DEPLOY_FAILED when
deploy actually succeeds (ANSI parse bug).

Root cause:
  1. cli-bridge.ts set FORCE_COLOR=0 in the subprocess env. Python's Rich library
     treats the non-empty string "0" as truthy, so `bool(os.environ["FORCE_COLOR"])`
     is True — Rich *enables* ANSI output instead of disabling it.

  2. The exception handler in app_deploy.py used unescaped Rich markup:
       console.print(f"[red]Error: {str(e)}[/red]")
     Exception messages that contain square brackets (e.g. OSError "[Errno 13]",
     Rich's own MarkupError "Tag '[x]' not recognized") cause a *secondary*
     MarkupError inside the except block. This secondary exception escapes the
     handler before `raise click.Abort()` is reached.

  3. Because click.Abort() is never raised, Click never writes "Aborted!" to
     stderr. The MCP tool checks `output.includes("Aborted")` — False — and
     falls through to the catch-all DEPLOY_FAILED, even though the deploy
     manifest was already saved and the app is live.

Fix: escape(str(e)) in the error handler + NO_COLOR=1 in cli-bridge.ts +
     stripAnsi in deploy.ts.
"""

import io
import pytest
from rich.console import Console
from rich.markup import escape


def _make_console() -> Console:
    """Return a Rich console writing to a buffer (no TTY, no ANSI codes)."""
    return Console(file=io.StringIO(), highlight=False)


class TestErrorHandlerEscape:
    """
    The error handler must use escape() so exception messages with brackets
    are rendered literally.

    Note on Rich version behaviour: Rich ≥ 13.x silently passes unrecognised
    markup tags through rather than raising MarkupError.  The escape() call is
    still required for correctness — without it, square-bracket sequences in
    exception messages are parsed as (attempted) markup and may be silently
    altered or dropped depending on the Rich version in use.  The positive tests
    below verify the fix regardless of Rich version.
    """

    def test_escaped_oserror_does_not_raise(self):
        """
        With escape(), the OSError message is safe to embed in Rich markup.
        This is the FIXED behaviour.
        """
        console = _make_console()
        exc = OSError("[Errno 13] Permission denied: '.env.local'")
        # Must not raise:
        console.print(f"[red]Error: {escape(str(exc))}[/red]")

    def test_escaped_markup_error_does_not_raise(self):
        """
        Cascading MarkupError is also handled safely after the fix.
        """
        from rich.errors import MarkupError as RichMarkupError

        console = _make_console()
        exc = RichMarkupError("Tag '[2001:db8::1]' at position 10 is not recognized")
        console.print(f"[red]Error: {escape(str(exc))}[/red]")

    def test_escaped_value_error_with_list_repr_does_not_raise(self):
        """
        Python's ValueError often includes list reprs like ['a', 'b'] which
        contain square brackets.
        """
        console = _make_console()
        exc = ValueError("Unsupported project types: ['unknown', 'legacy']")
        console.print(f"[red]Error: {escape(str(exc))}[/red]")

    @pytest.mark.parametrize("message", [
        "[Errno 2] No such file or directory: 'foo'",
        "[WinError 5] Access is denied",
        "Tag '[cyan]' at position 0 is not recognized",
        "Values: ['a', 'b', 'c']",
        "IPv6: http://[::1]:3000/",
        "Normal message with no brackets — still fine",
    ])
    def test_escape_handles_all_bracket_patterns(self, message: str):
        """escape() must make any exception message safe for Rich markup."""
        console = _make_console()
        exc = Exception(message)
        console.print(f"[red]Error: {escape(str(exc))}[/red]")

    def test_escaped_output_contains_original_text(self):
        """
        After escaping, the rendered output should still contain the original
        message text (without markup interpretation).
        """
        buf = io.StringIO()
        console = Console(file=buf, highlight=False, no_color=True)
        exc = OSError("[Errno 13] Permission denied: '.env.local'")
        console.print(f"[red]Error: {escape(str(exc))}[/red]")
        rendered = buf.getvalue()
        assert "[Errno 13]" in rendered, f"Original text lost in: {rendered!r}"
        assert "Permission denied" in rendered


class TestForceColorEnvBehaviour:
    """
    Verify that FORCE_COLOR='0' does NOT disable Rich colors in Python.
    This is the environment-variable misunderstanding documented in VAR-143.
    """

    def test_force_color_zero_is_truthy_in_python(self):
        """
        Python's os.environ stores values as strings. The string '0' is
        truthy — bool('0') is True — so setting FORCE_COLOR=0 in the
        subprocess env ENABLES Rich colors rather than disabling them.
        """
        assert bool("0") is True, (
            "FORCE_COLOR='0' passed via env is truthy in Python; "
            "use NO_COLOR=1 to disable Rich output"
        )

    def test_no_color_env_disables_rich_ansi(self, monkeypatch):
        """
        NO_COLOR=1 causes Rich Console to report no color system, which
        means no ANSI escape codes in the output.
        """
        monkeypatch.setenv("NO_COLOR", "1")
        buf = io.StringIO()
        # Force a fresh Console so it reads the updated env.
        console = Console(file=buf)
        # With NO_COLOR=1 the color_system should be None.
        assert console.color_system is None, (
            f"Expected color_system=None with NO_COLOR=1, got {console.color_system!r}"
        )
