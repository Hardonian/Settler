import re

with open(".github/workflows/ci.yml", "r") as f:
    content = f.read()

# Instead of stripping all cache params, we need to correctly configure caching if it's there
# Actually, the error says: "Caching for 'false' is not supported"
# Setup node supports: 'npm', 'pnpm', 'yarn'

content = re.sub(r'\s*cache:\s*(?:"false"|\'false\'|false)', '', content)

with open(".github/workflows/ci.yml", "w") as f:
    f.write(content)
