As a job seeker browsing LinkedIn job postings, I want to quickly generate a structured summary of any job listing so that I can efficiently evaluate opportunities without manually extracting key information.
Acceptance Criteria:

- Given I am viewing a job posting on LinkedIn
- When I click the browser extension button
- Then I should be presented with options to summarize the job posting
- Given I want a standardized summary format
- When I select the predefined format option
- Then the system should use generative AI to extract and generate a bullet-point summary including:

    - Job title
    - Company
    - Salary range
    - Work location
    - Benefits


- Given I want a custom summary format
- When I select the custom format option and describe my preferred format in natural language (e.g., "Focus on technical requirements and team structure")
- Then the system should use generative AI to interpret my request and generate a summary matching my specified criteria
- Given the summary is generated
- When I review the output
- Then the information should be accurately extracted from the job posting and presented in the requested format

Technical Notes:

- Generative AI will be used for both predefined and custom format processing
- The extension should integrate with a generative AI service to handle all content extraction and formatting
- The system should be able to parse LinkedIn job posting content
- Both predefined and custom formatting options should leverage AI for intelligent content analysis and presentation