import re

with open("packages/api/src/routes/v1/runs.ts", "r") as f:
    content = f.read()

content = content.replace("error instanceof Error", "_error instanceof Error")
content = content.replace("? error.message : String(error)", "? _error.message : String(_error)")
content = content.replace("? error : new Error(String(error))", "? _error : new Error(String(_error))")
content = content.replace("error: error.message", "error: _error.message")
content = content.replace("error: String(error)", "error: String(_error)")

with open("packages/api/src/routes/v1/runs.ts", "w") as f:
    f.write(content)
