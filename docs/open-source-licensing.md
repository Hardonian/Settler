# Open Source Licensing & Contributor Agreement

**Last Updated:** January 2026

## License Recommendations

Settler uses a **dual-licensing model** to balance open source community growth with sustainable business operations.

### Core Components (MIT License)

**What's MIT Licensed:**
- **SDK (`@settler/sdk`)**: MIT License
- **Adapter SDK (`@settler/adapter-sdk`)**: MIT License
- **Community Adapters**: MIT License (individual packages)
- **CLI Tool (`@settler/cli`)**: MIT License
- **Documentation**: CC BY 4.0

**Why MIT:**
- Maximum adoption and compatibility
- Permissive license encourages contributions
- Compatible with all major open source licenses
- Industry standard for developer tools

**MIT License Text:**
```
MIT License

Copyright (c) 2026 Settler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Hosted Service (Proprietary)

**What's Proprietary:**
- **Hosted API Service**: Proprietary (managed infrastructure)
- **Enterprise Features**: Proprietary (SSO, dedicated infrastructure, custom SLAs)
- **Advanced Analytics**: Proprietary (ML-powered insights, predictive alerts)
- **Compliance Certifications**: Proprietary (SOC 2, PCI-DSS hosted only)

**Why Proprietary:**
- Enables sustainable business model
- Funds continued development and support
- Provides managed service with SLA guarantees
- Supports compliance certifications

### Self-Hosted Core (AGPL v3)

**What's AGPL v3 Licensed:**
- **Self-Hosted Core Engine**: AGPL v3
- **Community Edition**: AGPL v3

**Why AGPL v3:**
- Ensures improvements are shared back with community
- Prevents proprietary forks without contributing back
- Still allows commercial use (with source code sharing)
- Common for infrastructure software

**AGPL v3 License Text:**
```
GNU AFFERO GENERAL PUBLIC LICENSE
Version 3, 19 November 2007

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.

[Full AGPL v3 text available at: https://www.gnu.org/licenses/agpl-3.0.html]
```

### License Compatibility Matrix

| Your License | Can Use MIT | Can Use AGPL v3 | Notes |
|--------------|-------------|-----------------|-------|
| **MIT** | ✅ Yes | ✅ Yes | Compatible |
| **Apache 2.0** | ✅ Yes | ✅ Yes | Compatible |
| **GPL v3** | ✅ Yes | ✅ Yes | Compatible |
| **AGPL v3** | ✅ Yes | ✅ Yes | Compatible |
| **BSD** | ✅ Yes | ✅ Yes | Compatible |
| **Proprietary** | ✅ Yes | ⚠️ Requires source sharing | AGPL requires sharing modifications |

---

## Contributor License Agreement (CLA)

### Individual Contributor License Agreement

**Version:** 1.0  
**Effective Date:** January 2026

By contributing to Settler, you agree to the following terms:

#### 1. Definitions

- **"You"** (or **"Your"**) means the individual or entity making a Contribution.
- **"Contribution"** means any original work of authorship, including any modifications or additions to an existing work, that is intentionally submitted by You to Settler for inclusion in the project.
- **"Project"** means the Settler open source project and its associated repositories.

#### 2. Grant of Copyright License

Subject to the terms and conditions of this Agreement, You hereby grant to Settler and to recipients of software distributed by Settler a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute Your Contributions and such derivative works.

#### 3. Grant of Patent License

Subject to the terms and conditions of this Agreement, You hereby grant to Settler and to recipients of software distributed by Settler a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work, where such license applies only to those patent claims licensable by You that are necessarily infringed by Your Contribution(s) alone or by combination of Your Contribution(s) with the Work to which such Contribution(s) was submitted.

If You institute patent litigation against any entity (including a cross-claim or counterclaim in a lawsuit) alleging that the Work or a Contribution incorporated within the Work constitutes direct or contributory patent infringement, then any patent licenses granted to You under this Agreement for that Work shall terminate as of the date such litigation is filed.

#### 4. Representations

You represent that:

1. **Original Work**: Each Contribution is Your original creation, or You have sufficient rights to grant the licenses granted in this Agreement.
2. **No Conflicts**: Your Contribution does not violate any third-party rights, including copyright, patent, trademark, or trade secret rights.
3. **No Legal Claims**: You are not aware of any pending or threatened legal action that would affect Your ability to grant the licenses in this Agreement.
4. **Compliance**: Your Contribution complies with all applicable laws and regulations.

#### 5. Disclaimer

**YOUR CONTRIBUTIONS ARE PROVIDED "AS IS".** THE CONTRIBUTOR(S) AND/OR SETTLER DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

#### 6. No Obligation

You are not obligated to provide support for Your Contributions, except to the extent You desire to provide support. You may provide support for free, for a fee, or not at all.

#### 7. Governing Law

This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.

#### 8. Entire Agreement

This Agreement constitutes the entire agreement between You and Settler regarding Your Contributions and supersedes all prior agreements and understandings.

---

### Corporate Contributor License Agreement

**Version:** 1.0  
**Effective Date:** January 2026

This Corporate Contributor License Agreement ("Agreement") is entered into between Settler ("Settler") and the entity identified below ("Corporation").

#### 1. Definitions

- **"Corporation"** means the entity making a Contribution.
- **"Contribution"** means any original work of authorship, including any modifications or additions to an existing work, that is intentionally submitted by Corporation to Settler for inclusion in the project.
- **"Authorized Representative"** means an individual authorized to bind Corporation to this Agreement.

#### 2. Grant of Copyright License

Subject to the terms and conditions of this Agreement, Corporation hereby grants to Settler and to recipients of software distributed by Settler a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute Corporation's Contributions and such derivative works.

#### 3. Grant of Patent License

Subject to the terms and conditions of this Agreement, Corporation hereby grants to Settler and to recipients of software distributed by Settler a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work, where such license applies only to those patent claims licensable by Corporation that are necessarily infringed by Corporation's Contribution(s) alone or by combination of Corporation's Contribution(s) with the Work to which such Contribution(s) was submitted.

#### 4. Representations

Corporation represents that:

1. **Authority**: The Authorized Representative has the authority to bind Corporation to this Agreement.
2. **Employee Authorization**: Corporation has obtained all necessary authorizations from its employees and contractors to grant the licenses in this Agreement.
3. **Original Work**: Each Contribution is Corporation's original creation, or Corporation has sufficient rights to grant the licenses granted in this Agreement.
4. **No Conflicts**: Corporation's Contribution does not violate any third-party rights, including copyright, patent, trademark, or trade secret rights.
5. **Compliance**: Corporation's Contribution complies with all applicable laws and regulations.

#### 5. Corporate Information

**Corporation Name:** _________________________  
**Authorized Representative Name:** _________________________  
**Title:** _________________________  
**Email:** _________________________  
**Address:** _________________________  
**Date:** _________________________

**Signature:** _________________________

---

## How to Contribute

### 1. Sign the CLA

**For Individual Contributors:**
- Read the Individual CLA above
- Open a pull request with your contribution
- Comment "I have read the CLA and agree to its terms"
- Your first contribution will require manual CLA verification

**For Corporate Contributors:**
- Download the Corporate CLA template
- Fill out the corporate information
- Have an authorized representative sign
- Email the signed CLA to legal@settler.io
- Include your GitHub username(s) in the email

### 2. Make Your Contribution

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Write tests** (if applicable)
5. **Update documentation** (if applicable)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to your fork** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### 3. Pull Request Guidelines

**Required:**
- Clear description of changes
- Link to related issues (if any)
- Tests pass (if applicable)
- Documentation updated (if applicable)
- CLA acknowledgment comment

**Preferred:**
- Small, focused PRs (easier to review)
- Follow existing code style
- Add tests for new features
- Update CHANGELOG.md

### 4. Code of Conduct

All contributors must follow our [Code of Conduct](./CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment.

---

## License FAQ

### Q: Can I use Settler SDK in my proprietary project?

**A:** Yes! The SDK is MIT licensed, so you can use it in any project (open source or proprietary) without restrictions.

### Q: Can I fork the self-hosted core and create a proprietary version?

**A:** No. The self-hosted core is AGPL v3 licensed, which requires you to share source code if you modify and distribute it. However, you can use it internally without sharing source code.

### Q: Do I need to sign a CLA for small contributions?

**A:** Yes, all contributions require CLA acceptance. This protects both you and the project.

### Q: Can I contribute adapters without signing a CLA?

**A:** No. All contributions to Settler repositories require CLA acceptance.

### Q: What if I want to contribute but my employer owns the copyright?

**A:** You'll need to use the Corporate CLA and have an authorized representative sign it.

### Q: Can I use Settler trademarks in my project?

**A:** You can use Settler trademarks to refer to the project, but not to imply endorsement or affiliation without permission. See our [Trademark Policy](./trademark-policy.md).

---

## Contact

**Legal Questions:** legal@settler.io  
**Contributor Support:** contributors@settler.io  
**General Inquiries:** hello@settler.io

---

**This document is reviewed annually. Last review: January 2026.**
