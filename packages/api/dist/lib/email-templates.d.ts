/**
 * Email Template Rendering System
 *
 * Renders lifecycle email templates with dynamic field replacement
 */
/**
 * Dynamic field data structure
 */
export interface EmailTemplateData {
    user?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        industry?: string;
        company_name?: string;
        plan_type?: string;
    };
    trial?: {
        trial_end_date?: string;
        trial_start_date?: string;
        days_remaining?: number;
        charge_date?: string;
    };
    product?: {
        product_name?: string;
        upgrade_url?: string;
        dashboard_url?: string;
        support_url?: string;
        pricing_url?: string;
        docs_url?: string;
        playground_url?: string;
        cookbooks_url?: string;
    };
    reconciliation?: {
        job_name?: string;
        job_id?: string;
        matched_count?: number;
        unmatched_count?: number;
        accuracy?: number;
        time_saved?: number;
        report_url?: string;
        platform_name?: string;
    };
    recommendations?: {
        next_recommendation?: string;
        workflow_suggestion?: string;
        analysis_summary?: string;
        top_insight_1?: string;
        top_insight_2?: string;
        recommendation_1?: string;
        recommendation_2?: string;
    };
    metrics?: {
        total_reconciliations?: number;
        jobs_created?: number;
        accuracy?: number;
        time_saved?: number;
    };
    workflow?: {
        workflow_name?: string;
        workflow_description?: string;
        use_case?: string;
        setup_time?: string;
        workflow_url?: string;
    };
    case_study?: {
        similar_company?: string;
        case_study_url?: string;
        case_studies_url?: string;
    };
    monthly?: {
        month?: string;
        renewal_date?: string;
        milestone_name?: string;
        milestone_metric?: string;
    };
    urls?: {
        profile_setup_url?: string;
        demo_url?: string;
        free_tier_url?: string;
        free_tier_info_url?: string;
        consultation_url?: string;
        insights_url?: string;
    };
    [key: string]: unknown;
}
/**
 * Render email template with data
 */
export declare function renderEmailTemplate(templateName: string, data: EmailTemplateData): Promise<string>;
/**
 * Generate plain text version from HTML
 */
export declare function generatePlainText(html: string): string;
/**
 * Get default URLs based on environment
 */
export declare function getDefaultUrls(): EmailTemplateData["product"] & EmailTemplateData["urls"];
//# sourceMappingURL=email-templates.d.ts.map