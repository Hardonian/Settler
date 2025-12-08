# Investor Relations - Private Documents

This directory contains confidential business documents, investor materials, and internal strategic planning documents.

**Security:** All files in this directory are encrypted using Git-crypt. Only authorized collaborators with GPG keys can decrypt and access these files.

## Setup Instructions

To access these encrypted files, you must:

1. **Install git-crypt:**
   ```bash
   # macOS
   brew install git-crypt
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install git-crypt
   
   # Or build from source: https://www.agwa.name/projects/git-crypt/
   ```

2. **Unlock the repository:**
   ```bash
   git crypt unlock
   ```
   (You'll need the GPG key that was added by the repository maintainer)

3. **Add a new collaborator:**
   ```bash
   git crypt add-gpg-user collaborator_email@example.com
   ```

## Contents

- Business model and market analysis
- Investor pitch decks and materials
- Sales and partnership templates
- Customer onboarding playbooks
- Strategic planning documents
- Team operations and hiring plans

---

**⚠️ WARNING:** Do not commit unencrypted versions of these files. All files in this directory are automatically encrypted by git-crypt.
