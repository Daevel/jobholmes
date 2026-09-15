// Default (and, today, only) locale catalog. Keys are organized by domain with names that
// describe the UI concept, not the displayed text — so wording can change without renaming keys.
export const en = {
  common: {
    actions: {
      cancel: "Cancel",
      saving: "Saving...",
      signOut: "Sign out",
      delete: "Delete",
      deleting: "Deleting...",
    },
    nav: {
      dashboard: "Dashboard",
      applications: "Applications",
      aiAnalyst: "AI Analyst",
      jobFit: "Job Fit",
      cvs: "CVs",
      addApplication: "Add application",
      primary: "Primary navigation",
      mobilePrimary: "Mobile primary navigation",
    },
    brand: {
      tagline: "Track. Understand. Get hired.",
    },
  },
  applications: {
    // Enum label maps: keys mirror the DB enum values exactly (used to derive stage/outcome
    // sort order in src/lib/applications/sort-order.ts) — do not add or remove keys here without
    // updating the corresponding enum in src/db/schema.ts and src/lib/applications/schema.ts.
    stage: {
      APPLICATION: "Application",
      RECRUITER_SCREENING: "Recruiter screening",
      HIRING_MANAGER: "Hiring manager",
      TECHNICAL: "Technical",
      CHALLENGE: "Challenge",
      FINAL: "Final",
      OFFER: "Offer",
    },
    outcome: {
      PENDING: "Pending",
      IN_PROGRESS: "In progress",
      REJECTED: "Rejected",
      WITHDRAWN: "Withdrawn",
      OFFER: "Offer",
    },
    match: {
      A_STRONG: "Strong",
      B_STRETCH: "Stretch",
      C_LONG_SHOT: "Long shot",
    },
    matchStatus: {
      notAnalyzed: "Not analyzed",
    },
    filters: {
      searchLabel: "Search company or role",
      searchPlaceholder: "Company or role",
      stageLabel: "Stage",
      stageAriaLabel: "Filter by stage",
      anyStage: "Any stage",
      outcomeLabel: "Outcome",
      outcomeAriaLabel: "Filter by outcome",
      anyOutcome: "Any outcome",
      matchLabel: "AI Match",
      matchAriaLabel: "Filter by AI match",
      anyMatch: "Any AI match",
    },
    list: {
      pageTitle: "Applications",
      pageSubtitle: "All your job applications in one place.",
      addApplicationCta: "+ Add application",
      emptyState: {
        title: "No applications found",
        description: "Add a new application or switch filters to see more tracked roles.",
        action: "Add application",
      },
    },
    table: {
      headers: {
        company: "Company",
        country: "Country",
        applied: "Applied",
        stage: "Stage",
        outcome: "Outcome",
        aiMatch: "AI Match",
        actions: "Actions",
      },
      viewAction: "View",
    },
    sections: {
      // Shared verbatim between the create/edit forms and the detail page's Notes section.
      notes: { title: "Notes" },
    },
    validation: {
      appliedDateRequired: "Applied date is required",
      companyRequired: "Company is required",
      roleRequired: "Role is required",
      invalidVacancyUrl: "Enter a valid vacancy URL",
      salaryMaxBelowMin: "Salary max must not be lower than salary min",
      countryRequiredUnlessRemoteOnly: "Country is required unless Remote only is selected",
      matchPercentageMustBeInteger: "Match percentage must be an integer",
    },
    form: {
      sections: {
        basicInfo: { title: "Basic information" },
        jobDescription: { title: "Job description" },
        employmentDetails: { title: "Employment details" },
      },
      company: { label: "Company", placeholder: "Acme GmbH" },
      role: { label: "Role", placeholder: "Senior Frontend Engineer" },
      appliedDate: { label: "Applied date" },
      remoteOnly: { label: "Remote only" },
      country: { label: "Country", placeholder: "Germany" },
      city: { label: "City", placeholder: "Berlin" },
      workMode: { label: "Work mode", placeholder: "Remote" },
      vacancyUrl: { label: "Vacancy URL", placeholder: "https://example.com/jobs/123" },
      roleCategory: { label: "Role category", placeholder: "Frontend" },
      seniority: { label: "Seniority", placeholder: "Senior" },
      cv: {
        label: "CV used",
        noneOption: "No CV selected",
        noCvsUploadedPrefix: "No CVs uploaded yet.",
        uploadCvLinkText: "Upload a CV",
        uploadCvSuffix: "to enable AI Match.",
        legacyValuePrefix: "Legacy CV value:",
      },
      jobDescription: { label: "Job description", placeholder: "Paste the full job description here..." },
      enrichment: {
        buttonLabel: "Extract details from JD",
        errors: {
          missingSource: "Paste a job description or vacancy URL first.",
          extractFailed: "JobHolmes could not extract details. Please try again.",
        },
      },
      workAuthorization: { label: "Work authorization", placeholder: "EU citizen" },
      sponsorship: {
        label: "Sponsorship required",
        options: { unknown: "Unknown", no: "No", yes: "Yes" },
      },
      salaryMin: { label: "Salary min", placeholder: "70000" },
      salaryMax: { label: "Salary max", placeholder: "90000" },
      currency: { label: "Currency", placeholder: "EUR" },
      stageContext: { label: "Stage context", placeholder: "Submission details, recruiter feedback, or next steps..." },
      rejectionReason: { label: "Rejection reason" },
      notes: { placeholder: "Context, recruiter notes, next steps..." },
      coverLetter: { label: "Cover letter", placeholder: "Write or paste your cover letter here..." },
      outcome: { label: "Outcome" },
      stage: { label: "Stage" },
      responseDate: { label: "Response date" },
      selectPlaceholder: "Select...",
      sourceField: {
        label: "Source",
        selectPlaceholder: "Select a source",
        otherOption: "Other",
        newSourceLabel: "New source name",
        newSourcePlaceholder: "e.g. Company career page",
        saveSourceLabel: "Save this source for future applications",
      },
    },
    new: {
      pageTitle: "Add application",
      pageEyebrow: "New application",
      pageSubtitle: "Capture the role details, selected CV, job description, match assessment, and notes.",
      sections: {
        basicInfo: { description: "The minimum details needed to identify this application." },
        jobDescription: { description: "Paste the job description so JobHolmes can extract role details and compare the position against your selected CV." },
        applicationContext: {
          title: "Application context",
          description: "Add context relevant to this application stage, such as submission details or early feedback.",
        },
      },
      submitButton: "Add application",
      errors: {
        createFailed: "Could not create application. Please try again.",
      },
    },
    edit: {
      pageTitle: "Edit application",
      pageEyebrow: "Edit application",
      cancelButton: "Cancel",
      sections: {
        basicInfo: { description: "Keep the core role information accurate and easy to scan." },
        jobDescription: { description: "Add or correct the job description used for AI Match. Changing the JD requires re-analysis." },
        applicationStatus: { title: "Application status" },
      },
      submitButton: "Save changes",
      errors: {
        updateFailed: "Could not update application. Please try again.",
        unlinkCvFailed: "Could not unlink the CV. Please try again.",
        deleteCvFailed: "Could not delete the CV. Please try again.",
        // POST /api/applications/[id]/unlink-cv's own error, distinct from the client fallback above.
        unlinkCvApiFailed: "Could not unlink the CV.",
      },
      cvRejection: {
        title: "This application was marked Rejected",
        description: "What should happen to the CV attached to it?",
        keep: "Keep the CV",
        unlink: "Unlink from this application",
        working: "Working...",
        deletePermanently: "Delete permanently",
        // {count} is replaced by the caller (src/lib/applications/cv-rejection-prompt.ts) — see
        // the note in src/lib/i18n/translate.ts about why t() itself has no interpolation engine.
        deletePermanentlyDisabledOne: "Also used by {count} other application.",
        deletePermanentlyDisabledOther: "Also used by {count} other applications.",
      },
    },
    detail: {
      backLink: "<- Back to applications",
      editButton: "Edit",
      header: {
        location: "Location",
        workMode: "Work mode",
        category: "Category",
        appliedOn: "Applied on",
      },
      sections: {
        overview: { title: "Overview" },
        aiMatch: { title: "AI Match" },
        funnel: { title: "Funnel" },
        compensation: { title: "Compensation" },
        jobDescription: { title: "Job description" },
        coverLetter: {
          title: "Cover letter",
          description: "Write or paste your cover letter for this application. To generate one from an AI Match, do it from Job Fit Preview before creating the application.",
        },
      },
      overview: {
        company: "Company",
        role: "Role",
        roleCategory: "Role category",
        seniority: "Seniority",
        location: "Location",
        workMode: "Work mode",
        source: "Source",
        cvUsed: "CV used",
        appliedDate: "Applied date",
        vacancyUrl: "Vacancy URL",
      },
      aiMatch: {
        class: "AI match class",
        score: "AI match score",
        confidence: "Confidence",
        cv: "CV",
        lastAnalyzed: "Last analyzed",
        legacyNotes: "Legacy requirements/gaps notes",
        needsRecalculation: "AI Match needs to be recalculated.",
        addJdFirst: "Add a job description before running AI Match.",
        selectCvFirst: "Select an uploaded CV before running AI Match.",
        analyzeButton: "Analyze match",
        reanalyzeButton: "Re-analyze",
        analyzingButton: "Analyzing...",
        analyzeError: "JobHolmes could not analyze this match. Please try again.",
        mobileCardPrefix: "AI Match: ",
      },
      funnel: {
        currentStage: "Current stage",
        outcome: "Outcome",
        responseDate: "Response date",
        daysToResponse: "Days to response",
        stageContext: "Stage context",
        rejectionReason: "Rejection reason",
      },
      compensation: {
        salaryRange: "Salary range",
        currency: "Currency",
        workAuthorization: "Work authorization",
        sponsorshipRequired: "Sponsorship required",
      },
      jobDescriptionSection: {
        showFull: "Show full description",
        empty: "No job description added yet.",
      },
    },
    // The interactive cover-letter widget's own copy (src/app/applications/[id]/cover-letter-section.tsx).
    // Its SectionCard title/description live under detail.sections.coverLetter above.
    coverLetter: {
      copyButton: "Copy",
      copiedButton: "Copied!",
      downloadButton: "Download .txt",
      errors: {
        saveFailed: "Could not save your changes. Please try again.",
        copyFailed: "Could not copy to clipboard.",
        invalidCoverLetterText: "Invalid cover letter text.",
        // PATCH /api/applications/[id]/cover-letter's own error, distinct from saveFailed above.
        saveApiFailed: "Could not save cover letter. Please try again.",
      },
      // checkCoverLetterEligibility() reasons (src/lib/ai/cover-letter.ts) — the function itself is
      // unused by the app today (generation moved to Job Fit Preview) but is kept, tests and all,
      // per the 4sexies task scope; these strings back its still-live t() calls.
      eligibility: {
        missingJd: "Add a job description before generating a cover letter.",
        missingCv: "Select an uploaded CV before generating a cover letter.",
        missingAiMatch: "Run AI Match on this application before generating a cover letter.",
        noCoveredRequirements: "AI Match found no covered requirements yet, so JobHolmes can't generate a grounded cover letter.",
      },
    },
  },
  // Shared KPI labels reused verbatim by more than one stats-card grid (dashboard and AI Analyst
  // both show a "stat card" widget for the same underlying metrics) — kept separate from the
  // enum/filter labels in applications.* above, which serve different UI roles even where the
  // English word happens to coincide (see the Task 11/Task i18n phase-1 note on not merging keys
  // purely because current text matches).
  metrics: {
    offers: "Offers",
    strongAiMatches: "Strong AI matches",
    rejected: "Rejected",
  },
  // API route (src/app/api/**) error strings shared across more than one endpoint — these are
  // Response.json({ error }) values, which client code shows directly when present (it only
  // falls back to the page/component-level *.errors.* strings above when the response body
  // itself doesn't carry a usable error string). Endpoint-specific messages live under the
  // relevant feature domain instead (e.g. jobFit.form.errors, applications.coverLetter.errors).
  errors: {
    invalidRequest: "Invalid request.",
    invalidApplication: "Invalid application.",
    applicationNotFound: "Application not found.",
    invalidAnalysis: "Invalid analysis.",
    analysisNotFound: "Analysis not found.",
    invalidCv: "Invalid CV.",
    cvNotFound: "CV not found.",
    cvHasNoExtractedText: "The selected CV has no readable extracted text.",
    auth: {
      signInToCreateApplication: "You must be signed in to create an application.",
      signInToAnalyzeJobFit: "You must be signed in to analyze a job fit.",
      signInToExtractDetails: "You must be signed in to extract details.",
      signInToUseAiAnalyst: "You must be signed in to use AI Analyst.",
      signInToViewAnalyses: "You must be signed in to view analyses.",
      signInToCreateAnalysis: "You must be signed in to create an analysis.",
      signInToDeleteAnalysis: "You must be signed in to delete an analysis.",
      signInToViewMessages: "You must be signed in to view messages.",
      signInToUpdateApplication: "You must be signed in to update this application.",
      signInToAnalyzeMatch: "You must be signed in to analyze a match.",
      signInToGenerateCoverLetter: "You must be signed in to generate a cover letter.",
      signInToSaveCoverLetter: "You must be signed in to save a cover letter.",
      signInToDeleteCvs: "You must be signed in to delete CVs.",
      signInToDownloadCvs: "You must be signed in to download CVs.",
    },
  },
  dashboard: {
    pageTitle: "Job Search Overview",
    pageSubtitle: "Here's an overview of your job search.",
    primaryMetricsAriaLabel: "Primary dashboard metrics",
    secondaryMetricsAriaLabel: "Secondary dashboard metrics",
    metrics: {
      totalApplications: "Total applications",
      inProgress: "In progress",
      stretchAiMatches: "Stretch AI matches",
      aiLongShots: "AI long shots",
    },
    emptyState: {
      title: "No applications yet",
      description: "Start tracking your job search by adding your first application.",
    },
    recentApplications: {
      title: "Recent applications",
      description: "Latest applications by applied date.",
      viewAllLink: "View all >",
    },
    table: {
      headers: { role: "Role" },
    },
  },
  cvs: {
    pageTitle: "CVs",
    pageSubtitle: "Store the CV versions you use for applications and AI Match.",
    emptyState: {
      title: "No CVs uploaded yet",
      description: "Upload a text-based PDF CV to enable selected-CV application tracking and CV-vs-JD AI Match.",
    },
    library: {
      title: "CV Library",
      description: "Your uploaded CV versions.",
      uploadedPrefix: "Uploaded",
    },
    downloadAction: "Download",
    deleteButton: {
      // {name} is replaced by the caller via .replace() — same convention as the CV-rejection
      // {count} interpolation in applications.edit.cvRejection above.
      ariaLabel: 'Delete "{name}"',
      dialogTitle: "Delete CV?",
      dialogDescriptionPrefix: "This will permanently delete “",
      dialogDescriptionSuffix: "” and its file. This cannot be undone.",
      errors: {
        deleteFailed: "Could not delete CV. Please try again.",
        // The DELETE /api/cvs/[id] route returns this one instead when it actually responds
        // (see the note on the top-level `errors` domain) — {count} via .replace(), as above.
        deleteFailedApi: "Could not delete CV.",
        blockedByApplicationsOne: "This CV is used by {count} application and can't be deleted. Unlink it from those applications first, or delete them.",
        blockedByApplicationsOther: "This CV is used by {count} applications and can't be deleted. Unlink it from those applications first, or delete them.",
      },
    },
    download: {
      failed: "Could not download CV.",
      fileNotFound: "CV file not found.",
    },
    upload: {
      title: "Upload CV",
      description: "Upload a text-based PDF so JobHolmes can compare it against job descriptions.",
      nameLabel: "CV name",
      namePlaceholder: "Frontend EN - 2026 v2",
      fileLabel: "PDF file",
      submitButton: "Upload CV",
      submittingButton: "Uploading...",
      hint: "PDF only. Maximum 5 MB. Scanned PDFs without extractable text are not supported.",
      errors: {
        nameRequired: "CV name is required.",
        fileRequired: "Choose a PDF file to upload.",
        uploadFailed: "Could not upload CV. Please try again.",
        onlyPdfSupported: "Only PDF files are supported.",
        invalidPdf: "Upload a valid PDF file.",
        fileTooLarge: "PDF files must be 5 MB or smaller.",
        noReadableText: "We could not extract readable text from this PDF. Please upload a text-based PDF.",
      },
    },
  },
  jobFit: {
    pageTitle: "Preview a job fit",
    pageEyebrow: "Job Fit",
    pageSubtitle: "Paste a job description and compare it against one of your CVs before creating an application, using the same matching engine as AI Match.",
    form: {
      jobDescriptionSection: {
        description: "Paste the job description and select the CV to compare it against. JobHolmes uses the same matching engine as AI Match on existing applications.",
      },
      cvToCompareLabel: "CV to compare",
      selectCvOption: "Select a CV",
      noCvsUploadedSuffix: "to use Job Fit.",
      analyzeButton: "Analyze fit",
      resultSection: { title: "Result" },
      staleWarning: "The job description or selected CV changed since this result was calculated. Analyze fit again before creating an application.",
      createSection: {
        title: "Create application from result",
        description: "Fill in the remaining application details. The Job Fit result above is saved with the new application without running the analysis again.",
      },
      createButton: "Create application from result",
      creatingButton: "Creating...",
      coverLetter: {
        label: "Cover letter",
        generateButton: "Generate cover letter",
        generatingButton: "Generating...",
        regenerateButton: "Regenerate",
        regeneratingButton: "Regenerating...",
      },
      errors: {
        previewFailed: "JobHolmes could not analyze this job fit. Please try again.",
        jdRequired: "Paste a job description before analyzing fit.",
        cvRequired: "Select a CV to compare.",
        selectCvBeforeJobFit: "Select an uploaded CV before running Job Fit.",
        resultExpired: "The job fit result is no longer valid or has expired. Please re-run the analysis before creating the application.",
        selectCvBeforeCreating: "Select an uploaded CV before creating the application.",
        coverLetterFailed: "JobHolmes could not generate the cover letter. Please try again.",
        noCoveredRequirements: "AI Match found no covered requirements yet, so JobHolmes can't generate a grounded cover letter.",
      },
    },
  },
  // Shared by the application detail page (Phase 1) and the Job Fit Preview (Phase 2) —
  // src/components/job-fit-analysis.tsx.
  jobFitAnalysis: {
    provisionalWarning: "This AI Match result is provisional.",
    // Reason strings determineProvisionalResult() (src/lib/ai/scoring.ts) pushes into
    // provisionalReasons, rendered verbatim by ProvisionalWarning above.
    reasons: {
      jdIncomplete: "The job description appears incomplete, so some requirements may be missing.",
      cvIncomplete: "The selected CV has limited readable content, so evidence may be incomplete.",
      noRequirementsExtracted: "No reliable requirements could be extracted from the job description.",
      unverifiedMaterialRequirement: "One or more material requirements could not be verified from the selected CV.",
    },
    requirementsTitle: "Requirements",
    gapsTitle: "Gaps",
    gapsEmpty: "No uncovered requirements found.",
    requirementEvidenceTitle: "Requirement evidence",
    evidencePrefix: "Evidence:",
    noEvidence: "No grounded CV evidence found.",
    unverifiedRequirementsTitle: "Unverified requirements",
    defaultEmpty: "None.",
    priority: {
      mustHave: "Must have",
      niceToHave: "Nice to have",
      unknown: "Priority unknown",
    },
    status: {
      covered: "Covered",
      partial: "Partial",
      notCovered: "Not covered",
      unknown: "Unknown",
    },
    gapType: {
      partial: "Partial",
      missing: "Missing",
    },
  },
  aiAnalyst: {
    pageTitle: "AI Analyst",
    pageSubtitle: "Ask questions about your job-search funnel and application patterns.",
    snapshot: {
      ariaLabel: "AI funnel snapshot",
      applications: "Applications",
      screeningRate: "Screening rate",
      technicalRate: "Technical rate",
    },
    analysesSectionAriaLabel: "AI analyses",
    analyses: {
      title: "Analyses",
      newAnalysisButton: "New analysis",
      empty: "No saved analyses yet. Ask a question to start.",
    },
    // {title} is replaced by the caller via .replace() — same convention used elsewhere for
    // parameterized strings (see applications.edit.cvRejection and cvs.deleteButton above).
    deleteAnalysisAriaLabel: 'Delete "{title}"',
    conversation: {
      title: "Conversation",
      loading: "Loading analysis...",
      analyzing: "Analyzing your job search...",
    },
    inputLabel: "Ask JobHolmes",
    inputPlaceholder: "Ask JobHolmes about your job search...",
    sendButton: "Send",
    emptyConversation: {
      intro: "Ask JobHolmes about your applications, funnel conversion, rejection patterns or role targeting.",
    },
    // Kept as individual keys (not an array) because the catalog only supports string leaves —
    // see src/lib/i18n/types.ts. Order matches the original suggestedQuestions list.
    suggestedQuestions: {
      q1: "Where is my funnel bottleneck?",
      q2: "How are my Strong applications performing?",
      q3: "What patterns do you see in my rejections?",
      q4: "Am I applying to too many Stretch roles?",
      q5: "What should I change in my application strategy?",
    },
    deleteDialog: {
      title: "Delete analysis?",
      descriptionPrefix: "This will permanently delete “",
      descriptionSuffix: "” and all its messages. This cannot be undone.",
    },
    errors: {
      loadMessagesFailed: "Could not load messages.",
      loadAnalysisFailed: "Could not load that analysis. Please try again.",
      createAnalysisFailed: "Could not create analysis.",
      createAnalysisFailedRetry: "Could not create a new analysis. Please try again.",
      deleteAnalysisFailed: "Could not delete analysis. Please try again.",
      chatFailed: "JobHolmes could not complete the analysis. Please try again.",
      loadAnalysesFailed: "Could not load analyses.",
      messageRequired: "Enter a message before sending.",
      // DELETE /api/ai/conversations/[id]'s own error, distinct from deleteAnalysisFailed above.
      deleteAnalysisApiFailed: "Could not delete analysis.",
    },
    // Default titles the server assigns a conversation on creation — distinct strings for the two
    // different creation paths that already existed before this migration.
    defaultConversationTitle: "Job search analysis",
    newConversationTitle: "New analysis",
    chatMessage: {
      userLabel: "You",
      assistantLabel: "JobHolmes",
    },
  },
  landing: {
    eyebrow: "Personal job search dashboard",
    heroTitle: "Understand your job search.",
    heroSubtitle: "Track applications, monitor your funnel and understand what is actually working.",
    signedInAs: "Signed in as",
    goToDashboard: "Go to dashboard",
    signInTitle: "Sign in to continue",
    signInSubtitle: "Load the same JobHolmes account from every device.",
    signInButton: "Sign in with GitHub",
  },
} as const;
