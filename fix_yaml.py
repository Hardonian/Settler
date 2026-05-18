import re

with open(".github/workflows/ci.yml", "r") as f:
    content = f.read()

# We need to completely remove the string 'cache: "false"' and 'cache: false' from the yaml
# And also the empty lines left behind
content = re.sub(r'\n\s*cache:\s*(?:"false"|\'false\'|false)', '', content)
content = re.sub(r'\n\s*\n\s*- name: Setup pnpm', '\n\n      - name: Setup pnpm', content)

with open(".github/workflows/ci.yml", "w") as f:
    f.write(content)
