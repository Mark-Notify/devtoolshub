// /pages/terms.tsx
import Head from "next/head";
import React from "react";

const COMPANY_NAME = "DevToolsHub";
const DOMAIN = "https://www.devtoolshub.org";
const LAST_UPDATED = "August 10, 2025";

const TermsAndConditions: React.FC = () => {
    return (
        <>
            <Head>
                <title>Terms and Conditions - {COMPANY_NAME}</title>
                <meta name="description" content={`${COMPANY_NAME} Terms and Conditions`} />
            </Head>

            <main className="min-h-screen bg-base-100 py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8">
                        <header className="mb-6">
                            <h1 className="text-2xl font-semibold mb-1">Terms and Conditions</h1>
                            <p className="text-sm text-gray-600">
                                Last updated: {LAST_UPDATED}
                            </p>
                        </header>

                        <section className="prose prose-sm prose-invert mb-6">
                            <p>
                                Welcome to <strong>{COMPANY_NAME}</strong> ({DOMAIN}). By accessing or using our website,
                                services, or tools (collectively, the “Service”), you agree to be bound by these Terms
                                and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Service.
                            </p>

                            <h2>1. Use of the Service</h2>
                            <p>
                                You may use the Service only in compliance with these Terms and all applicable laws and regulations.
                                You agree not to misuse the Service or help anyone else do so. Unauthorized use, reproduction, or distribution
                                of the Service (or any portion) is prohibited.
                            </p>

                            <h2>2. Accounts and Registration</h2>
                            <p>
                                Some features may require you to register for an account and provide personal information. You agree to provide
                                accurate, current, and complete information, and to keep your account credentials secure. You are responsible for
                                all activity under your account.
                            </p>

                            <h2>3. User Content</h2>
                            <p>
                                You retain ownership of content you submit to the Service ("User Content"). By submitting User Content you grant
                                {` ${COMPANY_NAME} `} a non-exclusive, worldwide, royalty-free license to use, copy, modify, and display such content
                                for the purpose of providing and improving the Service.
                            </p>

                            <h2>4. Prohibited Conduct</h2>
                            <p>
                                You must not submit content or take actions that: infringe others' rights, are unlawful, harmful, abusive, obscene,
                                or otherwise objectionable; attempt to reverse engineer the Service; interfere with the Service’s operation; or
                                bypass any access controls.
                            </p>

                            <h2>5. Third-party Links and Services</h2>
                            <p>
                                The Service may contain links to third-party websites or integrate third-party services. Such links and integrations
                                are provided for convenience only. {COMPANY_NAME} does not control or endorse third-party content and is not
                                responsible for it.
                            </p>

                            <h2>6. Privacy</h2>
                            <p>
                                Our <a href="/privacy">Privacy Policy</a> explains how we collect and use personal data. By using the Service you
                                agree to the collection and use of information in accordance with that policy.
                            </p>

                            <h2>7. Disclaimers</h2>
                            <p>
                                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT
                                PERMITTED BY LAW, {COMPANY_NAME} DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY,
                                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                            </p>

                            <h2>8. Limitation of Liability</h2>
                            <p>
                                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL {COMPANY_NAME} BE LIABLE FOR ANY INDIRECT,
                                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
                                OUR AGGREGATE LIABILITY WILL NOT EXCEED THE AMOUNT YOU PAID (IF ANY) TO USE THE SERVICE IN THE PAST 12 MONTHS.
                            </p>

                            <h2>9. Termination</h2>
                            <p>
                                We may suspend or terminate your access to the Service at any time for breach of these Terms or for any lawful reason.
                                Termination does not relieve you of obligations incurred prior to termination.
                            </p>

                            <h2>10. Changes to These Terms</h2>
                            <p>
                                We may update these Terms from time to time. When we do, we will post the updated Terms on this page with a new
                                "Last updated" date. Your continued use of the Service after changes indicates your acceptance of the new Terms.
                            </p>

                            <h2>11. Governing Law</h2>
                            <p>
                                These Terms are governed by and construed in accordance with the laws of the jurisdiction where {COMPANY_NAME}
                                is incorporated, without regard to conflict of laws principles. Any dispute arising out of or related to these Terms
                                shall be resolved in the competent courts of that jurisdiction.
                            </p>

                            <h2>12. Contact</h2>
                            <p>
                                If you have questions about these Terms, contact us at:
                                <br />
                                <strong>support@devtoolshub.org</strong>
                            </p>

                            <p className="text-sm text-gray-500 mt-4">
                                <em>Note: This document is a general template and does not constitute legal advice. Consider consulting a qualified attorney
                                    to tailor terms to your needs and jurisdiction.</em>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
};

export default TermsAndConditions;
