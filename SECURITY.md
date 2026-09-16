# Security policy

Swarm Defense Arena executes automated browser sessions and must be treated as security-sensitive software.

## Supported use

The default configuration is intended for a trusted local workstation. Remote API access is disabled unless `SENTINEL_API_TOKEN` is configured. Private, loopback, link-local, reserved, and multicast browser targets are blocked unless the operator explicitly enables private targets.

Do not expose the development server directly to the internet. Shared deployments should add TLS, user authentication, network egress controls, process/container isolation, quotas, and durable external job storage.

## Reporting

Please report vulnerabilities privately through GitHub's security-advisory feature. Do not include real credentials, captured private pages, or sensitive session exports in an issue.

## Data handling

The runner stores session traces and screenshots under `.sentinel-data/`. Typed values matching common secret patterns and password inputs are redacted, but operators should still use synthetic accounts and non-sensitive tasks. Delete local artifacts according to your retention policy.
