# Settler

Critical revenue/infra repo in the Hardonia/AIAS sovereign stack.

## Connective Tissue
- Revenue DB: `/home/scott/ai-lab/revenue-os/revenue-os.db`
- Deploy/verify: `/home/scott/ai-lab/scripts/bin/deploy-all.sh`
- Health: `systemctl --user status Settler.*` or port probe
- Ops truth: `python3 /home/scott/.hermes/scripts/ops-nerve-center.py`

## Notes
- Do not duplicate core services.
- Keep secrets out of repo; use `/home/scott/.local/etc/*.env`.
