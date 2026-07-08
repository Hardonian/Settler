# Bootstrap (few clicks)

This repo is bootstrap-ready. Pick your stack below.

## 0. Prereqs (one time)
- Python 3.12+  (or Node 18+ / Go 1.22+ / Rust 1.78+ depending on stack)
- [just](https://github.com/casey/just)  ->  `pipx install rust-just`  or  `brew install just`
- Git

## 1. One-command bootstrap
```bash
just bootstrap        # detects stack, creates venv/.env, installs deps, runs smoke test
```
or without `just`:
```bash
./scripts/bootstrap.sh
```

## 2. Configure
```bash
cp .env.example .env  # then edit .env with your keys (never commit .env)
```

## 3. Run / dev
```bash
just dev              # start the app locally
just test             # run the test suite
just status           # health check
```

## 4. Docker (optional)
```bash
docker compose up --build
```

## 5. Verify it works
```bash
just smoke            # asserts the service responds on its health endpoint
```

Need help? Open an issue or see the operator docs at aiautomatedsystems.ca.
