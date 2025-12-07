# Git-crypt Setup Instructions

This repository uses **git-crypt** to encrypt sensitive files in the `/INVESTOR-RELATIONS-PRIVATE` directory.

## Initial Setup (Repository Maintainer)

1. **Install git-crypt:**

   ```bash
   # macOS
   brew install git-crypt

   # Linux (Ubuntu/Debian)
   sudo apt-get install git-crypt

   # Or build from source
   git clone https://www.agwa.name/git/git-crypt.git
   cd git-crypt
   make
   sudo make install
   ```

2. **Initialize git-crypt in the repository:**

   ```bash
   git crypt init
   ```

3. **Add yourself as a GPG user:**

   ```bash
   git crypt add-gpg-user your_email@example.com
   ```

   (This requires your GPG key to be set up. If you don't have one, generate it first: `gpg --gen-key`)

4. **Commit the .gitattributes file:**

   ```bash
   git add .gitattributes
   git commit -m "feat(security): Configure git-crypt for private investor assets"
   ```

5. **Add and commit the encrypted files:**
   ```bash
   git add INVESTOR-RELATIONS-PRIVATE/
   git commit -m "docs(ir): Add encrypted internal business documents"
   ```

## Adding Collaborators

To grant access to another collaborator:

1. **Get their GPG public key:**

   ```bash
   # They should export it:
   gpg --armor --export their_email@example.com > collaborator.asc
   ```

2. **Add them to git-crypt:**

   ```bash
   git crypt add-gpg-user collaborator_email@example.com
   ```

3. **Commit the updated keyring:**
   ```bash
   git add .git-crypt/
   git commit -m "feat(security): Add collaborator to git-crypt access"
   git push
   ```

## Unlocking Encrypted Files (Collaborators)

1. **Install git-crypt** (see above)

2. **Unlock the repository:**

   ```bash
   git crypt unlock
   ```

   (You'll be prompted for your GPG key passphrase)

3. **Verify files are decrypted:**
   ```bash
   ls INVESTOR-RELATIONS-PRIVATE/
   # Files should be readable
   ```

## Troubleshooting

- **"git crypt: not found"**: Install git-crypt first
- **"gpg: no valid OpenPGP data found"**: Ensure GPG is installed and configured
- **"git crypt unlock" fails**: Verify your GPG key was added by the maintainer
- **Files appear encrypted**: Run `git crypt unlock` to decrypt them

## Security Notes

- Never commit unencrypted versions of files in `INVESTOR-RELATIONS-PRIVATE/`
- The `.gitattributes` file ensures all files in that directory are automatically encrypted
- GPG keys should be stored securely and backed up
- Rotate keys periodically for enhanced security
