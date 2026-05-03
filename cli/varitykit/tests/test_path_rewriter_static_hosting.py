import tempfile
from pathlib import Path

from varitykit.core.path_rewriter import inject_base_tag, rewrite_paths_for_static_hosting


def test_rewrite_keeps_app_navigation_absolute():
    with tempfile.TemporaryDirectory() as tmpdir:
        out = Path(tmpdir)
        html = out / "index.html"
        html.write_text(
            '<html><head></head><body><a href="/login/">Login</a><script src="/_next/static/chunks/main.js"></script></body></html>',
            encoding="utf-8",
        )

        rewrite_paths_for_static_hosting(str(out))
        content = html.read_text(encoding="utf-8")

        # Critical regression guard: route links must not be rewritten to relative
        # paths (e.g. login/) because that can resolve to /login on no-slash URLs.
        assert 'href="/login/"' in content
        # Asset path rewrite for static portability is still expected.
        assert 'src="_next/static/chunks/main.js"' in content


def test_inject_base_tag_adds_subpath_base_href():
    with tempfile.TemporaryDirectory() as tmpdir:
        out = Path(tmpdir)
        html = out / "index.html"
        html.write_text('<html><head><meta charSet="utf-8"/></head><body>Hello</body></html>', encoding="utf-8")

        modified = inject_base_tag(str(out), "/my-app/")
        content = html.read_text(encoding="utf-8")

        assert modified == 1
        assert '<base href="/my-app/">' in content
