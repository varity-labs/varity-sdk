from dataclasses import dataclass

from varitykit.services import akash_deploy_service as svc


@dataclass
class SdkStyleAkashResult:
    success: bool
    deployment_id: str
    lease_id: str
    provider: str
    service_url: str
    cost_uakt: int
    created_at: int


class StubDeployer:
    result = None

    def __init__(self, api_key):
        self.api_key = api_key

    def deploy(self, sdl, deposit):
        return self.result


def _patch_deploy_dependencies(monkeypatch, result):
    StubDeployer.result = result
    monkeypatch.setattr(svc, "AkashConsoleDeployer", StubDeployer)
    monkeypatch.setattr(svc, "_generate_sdl", lambda **kwargs: "sdl")
    monkeypatch.setattr(svc, "_resolve_api_key", lambda api_key=None: "akash-key")
    monkeypatch.setattr(svc, "_wait_for_healthy", lambda **kwargs: True)


def test_deploy_accepts_dict_console_result(monkeypatch):
    _patch_deploy_dependencies(
        monkeypatch,
        {
            "dseq": "26653321",
            "provider": "akash1provider",
            "url": "provider.example.com:31000",
        },
    )

    result = svc.deploy(
        github_repo_url="https://github.com/example/app",
        app_name="example",
        api_key="akash-key",
        verbose=False,
    )

    assert result.success is True
    assert result.dseq == "26653321"
    assert result.provider == "akash1provider"
    assert result.url == "http://provider.example.com:31000"


def test_deploy_accepts_sdk_style_akash_result(monkeypatch):
    _patch_deploy_dependencies(
        monkeypatch,
        SdkStyleAkashResult(
            success=True,
            deployment_id="26653321",
            lease_id="lease-1",
            provider="akash1provider",
            service_url="https://deployment.example.com",
            cost_uakt=10,
            created_at=1777786400,
        ),
    )

    result = svc.deploy(
        github_repo_url="https://github.com/example/app",
        app_name="example",
        api_key="akash-key",
        verbose=False,
    )

    assert result.success is True
    assert result.dseq == "26653321"
    assert result.provider == "akash1provider"
    assert result.url == "https://deployment.example.com"
