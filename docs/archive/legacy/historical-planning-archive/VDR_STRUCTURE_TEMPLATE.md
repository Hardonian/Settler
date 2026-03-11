# Virtual Data Room (VDR) Structure Template

**Company:** Settler, Inc.  
**VDR Platform:** [To be determined - Dropbox, Google Drive, or dedicated VDR]  
**Access Level:** Investors (upon term sheet execution)  
**Last Updated:** January 2026

---

## VDR Setup Instructions

### Step 1: Choose VDR Platform
**Options:**
- **Dropbox Business** - Simple, cost-effective ($15/user/month)
- **Google Drive** - Integrated with G Suite, easy sharing
- **Dedicated VDR** - Intralinks, Datasite, Firmex ($500-$2000/month)
- **Self-hosted** - Secure server with access controls

**Recommendation:** Start with Dropbox Business or Google Drive, upgrade to dedicated VDR if needed.

### Step 2: Create Folder Structure
Use the structure below to organize all documents.

### Step 3: Set Up Access Controls
- **Read-only access** for investors
- **Audit logging** for all access
- **Watermarking** for sensitive documents (optional)
- **Expiration dates** for access (if term sheet expires)

### Step 4: Upload Documents
Upload all documents according to the Due Diligence Index.

---

## VDR Folder Structure

```
Settler_Seed_Round_VDR/
│
├── 01_Corporate_Legal/
│   ├── 1.1_Corporate_Formation/
│   │   ├── Certificate_of_Incorporation.pdf
│   │   ├── Certificate_of_Good_Standing.pdf
│   │   ├── Bylaws.pdf
│   │   └── Corporate_Minute_Book/
│   │       ├── Board_Meeting_Minutes/
│   │       └── Shareholder_Meeting_Minutes/
│   │
│   ├── 1.2_Capitalization_Table/
│   │   ├── Current_Cap_Table.xlsx
│   │   ├── Cap_Table_History.xlsx
│   │   ├── Stock_Option_Plan.pdf
│   │   └── Pro_Forma_Cap_Table.xlsx
│   │
│   ├── 1.3_Intellectual_Property/
│   │   ├── IP_Assignment_Agreements/
│   │   │   ├── Founder_1_IP_Assignment.pdf
│   │   │   ├── Founder_2_IP_Assignment.pdf
│   │   │   └── Employee_IP_Assignments/
│   │   ├── Patent_Applications/
│   │   ├── Trademark_Registrations/
│   │   ├── Copyright_Registrations/
│   │   └── Open_Source_License_Audit.pdf
│   │
│   ├── 1.4_Employment_Agreements/
│   │   ├── Founder_Employment_Agreements/
│   │   ├── Employee_Agreements/
│   │   ├── Contractor_Agreements/
│   │   └── Non_Compete_Agreements/
│   │
│   ├── 1.5_Advisory_Board/
│   │   ├── Advisor_1_Agreement.pdf
│   │   ├── Advisor_2_Agreement.pdf
│   │   └── Advisor_3_Agreement.pdf
│   │
│   └── 1.6_Legal_Compliance/
│       ├── Business_Licenses/
│       ├── Tax_IDs/
│       ├── Compliance_Certifications/
│       ├── Privacy_Policy.pdf
│       ├── Terms_of_Service.pdf
│       └── Insurance_Policies/
│
├── 02_Financial/
│   ├── 2.1_Historical_Financials/
│   │   ├── P_L_Statements/
│   │   ├── Balance_Sheets/
│   │   ├── Cash_Flow_Statements/
│   │   ├── Bank_Statements/
│   │   └── Tax_Returns/
│   │
│   ├── 2.2_Financial_Projections/
│   │   ├── 3_Year_Financial_Model.xlsx
│   │   ├── Monthly_Cash_Flow_Projections.xlsx
│   │   ├── Scenario_Analysis.xlsx
│   │   ├── Unit_Economics_Model.xlsx
│   │   └── Use_of_Funds.xlsx
│   │
│   └── 2.3_Accounting_Tax/
│       ├── Chart_of_Accounts.xlsx
│       ├── Accounting_Policies.pdf
│       └── Tax_Elections/
│
├── 03_Technical_Product/
│   ├── 3.1_Technical_Architecture/
│   │   ├── System_Architecture_Diagram.pdf
│   │   ├── Infrastructure_Documentation.pdf
│   │   ├── Security_Architecture.pdf
│   │   └── API_Documentation/
│   │       └── OpenAPI_Spec.yaml
│   │
│   ├── 3.2_Code_Quality_Security/
│   │   ├── Code_Quality_Report.pdf
│   │   ├── Security_Audit_Report.pdf
│   │   ├── Penetration_Testing_Report.pdf
│   │   ├── Dependency_Audit.pdf
│   │   └── CI_CD_Documentation.pdf
│   │
│   ├── 3.3_Product_Documentation/
│   │   ├── Product_Roadmap.pdf
│   │   ├── Feature_Specifications/
│   │   ├── User_Documentation/
│   │   └── Product_Demo_Video.mp4
│   │
│   └── 3.4_Data_Privacy/
│       ├── Data_Privacy_Policy.pdf
│       ├── GDPR_Compliance_Documentation.pdf
│       └── Security_Incident_Response_Plan.pdf
│
├── 04_Business_Market/
│   ├── 4.1_Market_Analysis/
│   │   ├── Market_Sizing_Analysis.pdf
│   │   ├── Competitive_Analysis.pdf
│   │   └── Industry_Research_Reports/
│   │
│   ├── 4.2_Go_to_Market/
│   │   ├── GTM_Plan.pdf
│   │   ├── Sales_Process_Documentation.pdf
│   │   ├── Marketing_Strategy.pdf
│   │   └── Pricing_Strategy.pdf
│   │
│   ├── 4.3_Traction_Validation/
│   │   ├── Customer_List.xlsx
│   │   ├── Customer_Testimonials.pdf
│   │   ├── Letters_of_Intent/
│   │   ├── Customer_Interviews_Synthesis.pdf
│   │   └── Product_Market_Fit_Report.pdf
│   │
│   └── 4.4_Team_Hiring/
│       ├── Team_Bios.pdf
│       ├── Organizational_Chart.pdf
│       ├── 18_Month_Hiring_Roadmap.pdf
│       └── Job_Descriptions/
│
├── 05_Investor_Materials/
│   ├── 5.1_Pitch_Materials/
│   │   ├── Pitch_Deck.pdf
│   │   ├── Executive_Summary.pdf
│   │   └── Product_Demo_Video.mp4
│   │
│   └── 5.2_Term_Sheet/
│       ├── Term_Sheet.pdf
│       └── Legal_Opinion.pdf
│
├── 06_Operational/
│   ├── 6.1_Operations_Processes/
│   │   ├── Standard_Operating_Procedures/
│   │   │   ├── Sales_SOP.pdf
│   │   │   ├── Customer_Success_SOP.pdf
│   │   │   ├── Bug_Fix_SOP.pdf
│   │   │   ├── Onboarding_SOP.pdf
│   │   │   └── Support_SOP.pdf
│   │   └── CRM_Support_Documentation.pdf
│   │
│   └── 6.2_Metrics_Reporting/
│       ├── KPIs_Dashboard.pdf
│       ├── Unit_Economics_Dashboard.pdf
│       └── Monthly_Investor_Update_Template.pdf
│
├── 07_Risk_Management/
│   ├── Risk_Register.pdf
│   ├── Risk_Mitigation_Plans.pdf
│   ├── Business_Continuity_Plan.pdf
│   └── Disaster_Recovery_Plan.pdf
│
└── 00_Index_Guides/
    ├── Due_Diligence_Index.pdf
    ├── VDR_Access_Instructions.pdf
    └── Document_Status_Tracker.xlsx
```

---

## Document Status Tracker

Create an Excel/Google Sheets file to track document status:

| Document Name | Section | Status | Owner | Last Updated | Notes |
|--------------|---------|--------|-------|--------------|-------|
| Certificate of Incorporation | 1.1 | ✅ Complete | Legal | 2026-01-15 | - |
| Cap Table | 1.2 | 🚧 In Progress | CFO | 2026-01-15 | Need to update with latest grants |
| IP Assignments | 1.3 | ⚠️ Missing | Legal | - | Need to collect from all employees |
| Financial Model | 2.2 | ✅ Complete | CFO | 2026-01-15 | - |
| Pitch Deck | 5.1 | 🚧 In Progress | CEO | 2026-01-15 | Need to design slides |

**Status Legend:**
- ✅ Complete - Document ready
- 🚧 In Progress - Document being created/updated
- ⚠️ Missing - Document not yet created
- ❌ Not Applicable - Document not needed

---

## VDR Access Instructions (For Investors)

### How to Request Access
1. Contact: [Email/Contact]
2. Sign NDA (if not already executed)
3. Receive VDR link and credentials
4. Access expires [X] days after term sheet expiration (if not executed)

### Access Levels
- **Read-Only:** Standard investor access
- **Download:** May be restricted for sensitive documents
- **Print:** May be restricted (watermarking enabled)

### Document Organization
- Documents are organized by section (see folder structure)
- Use the Due Diligence Index to navigate
- Document Status Tracker shows completion status

### Security
- All access is logged and audited
- Documents may be watermarked
- Download restrictions may apply to sensitive documents
- Access expires automatically if term sheet expires

---

## Document Collection Checklist

### Corporate & Legal (Priority: High)
- [ ] Certificate of Incorporation
- [ ] Certificate of Good Standing (current, within 30 days)
- [ ] Bylaws
- [ ] Cap Table (current, fully diluted)
- [ ] IP Assignment Agreements (all founders/employees)
- [ ] Employment Agreements (all employees)
- [ ] Advisory Board Agreements
- [ ] Business Licenses
- [ ] Tax IDs

### Financial (Priority: High)
- [ ] Historical Financials (P&L, Balance Sheet, Cash Flow)
- [ ] 3-Year Financial Model
- [ ] Unit Economics Model
- [ ] Use of Funds Breakdown
- [ ] Tax Returns (all years)

### Technical & Product (Priority: Medium)
- [ ] System Architecture Diagram
- [ ] Security Audit Report
- [ ] Code Quality Report
- [ ] Product Roadmap
- [ ] API Documentation

### Business & Market (Priority: Medium)
- [ ] Market Sizing Analysis
- [ ] Competitive Analysis
- [ ] GTM Plan
- [ ] Customer List
- [ ] Letters of Intent

### Investor Materials (Priority: High)
- [ ] Pitch Deck (designed)
- [ ] Executive Summary
- [ ] Product Demo Video

---

## VDR Setup Tasks

### Week 1: Platform Setup
- [ ] Choose VDR platform
- [ ] Set up account and folder structure
- [ ] Configure access controls
- [ ] Set up audit logging
- [ ] Create Document Status Tracker

### Week 2: Document Collection
- [ ] Identify all existing documents
- [ ] Create list of missing documents
- [ ] Assign owners for document collection
- [ ] Begin uploading existing documents

### Week 3: Document Organization
- [ ] Organize all documents by section
- [ ] Update Document Status Tracker
- [ ] Create VDR Access Instructions
- [ ] Test access controls

### Week 4: Finalization
- [ ] Complete all missing documents
- [ ] Final review of VDR organization
- [ ] Prepare for investor access
- [ ] Create backup of VDR

---

## VDR Maintenance

### Weekly Updates
- [ ] Update Document Status Tracker
- [ ] Upload new documents as they become available
- [ ] Review access logs

### Monthly Updates
- [ ] Update financial documents (if material changes)
- [ ] Update traction metrics
- [ ] Review and update Due Diligence Index

### As Needed
- [ ] Add new documents as requested by investors
- [ ] Update access controls
- [ ] Respond to investor questions

---

**Document Owner:** CFO/Founder  
**Last Updated:** January 2026  
**Next Review:** Weekly during fundraising

---

*This VDR structure template should be used to organize all documents for Seed Round due diligence. Keep the Document Status Tracker updated regularly.*
