# GitHub Wiki Construction Manual

## Purpose
This manual provides a standardized approach for building comprehensive documentation wikis for software projects.

## Wiki Structure Template

### 1. Home Page (`Home.md`)
- Language switcher for multilingual support
- Project technical overview and purpose
- Quick navigation to all sections
- Quick navigation to technical documentation
- Links to key developer resources (repository, CI/CD, package registry)

### 2. Getting Started
- `Getting-Started-Development-Setup.md` - Setting up the development environment
- `Getting-Started-Quick-Start.md` - Get the code running in 5 minutes
- `Getting-Started-Architecture-Overview.md` - High-level system design
  <!-- Use Mermaid syntax for visual representation -->
- `Getting-Started-Core-Concepts.md` - Essential technical concepts and terminology

### 3. Architecture
- `Architecture-Technology-Stack.md` - Languages, frameworks, and tools used
- `Architecture-System-Design.md` - Overall architecture and design patterns
- `Architecture-Module-Structure.md` - Code organization and dependencies
  <!-- Use Mermaid syntax for visual representation -->
- `Architecture-Data-Flow.md` - How data moves through the system
  <!-- Use Mermaid syntax for visual representation -->

### 4. Testing
<!-- Skip items that don't exist -->
- `Testing-Testing-Strategy.md` - Overall testing approach
- `Testing-Unit-Testing.md` - Writing and running unit tests
- `Testing-Integration-Testing.md` - Integration test guidelines
- `Testing-E2E-Testing.md` - End-to-end testing approach
- `Testing-Performance-Testing.md` - Load and performance testing

### 5. Development Guides
<!-- Skip items that don't exist -->
- `Development-Guides-Local-Development.md` - Running locally
- `Development-Guides-Debugging.md` - Debugging techniques and tools
- `Development-Guides-Profiling.md` - Performance profiling
- `Development-Guides-Logging.md` - Logging standards and practices
- `Development-Guides-Monitoring.md` - Observability and monitoring
- `Development-Guides-Code-Styles.md` - Coding conventions and style guide

### 6. Deployment
<!-- Skip items that don't exist -->
- `Deployment-Build-Process.md` - How to build the project
- `Deployment-Configuration.md` - Environment configuration
- `Deployment-Deployment-Guide.md` - Deployment procedures
- `Deployment-Infrastructure.md` - Infrastructure requirements
- `Deployment-CI-CD.md` - Continuous integration and deployment

### 7. Security
<!-- Skip items that don't exist -->
- `Security-Security-Overview.md` - Security architecture
- `Security-Authentication.md` - Auth implementation
- `Security-Authorization.md` - Access control
- `Security-Security-Best-Practices.md` - Secure coding guidelines

## File Naming Convention

Since GitHub Wiki uses a flat file structure, use the following naming pattern:

### For English Documentation
`Category-SubCategory-PageName.md`

Examples:
- `Getting-Started-Development-Setup.md`
- `Architecture-Technology-Stack.md`
- `Testing-Unit-Testing.md`

### For Multilingual Support
Prefix with language code:
- English: Use standard pattern (no prefix)
- Japanese: `JA-Category-SubCategory-PageName.md`
- Other languages: `[LANG]-Category-SubCategory-PageName.md`

Examples:
- `JA-Getting-Started-Development-Setup.md`
- `JA-Architecture-Technology-Stack.md`

## Rules

- **Accuracy and Verification**: 
  - **CRITICAL**: Only document facts that can be verified in the actual codebase
  - Before writing about any tool, framework, or process, verify its actual usage in the repository
  - Never assume or guess about technical details - always verify
  - If unsure about a technical detail, check the source code first
- **Formatting**: Use GitHub Flavored Markdown.
  - **Mermaid Syntax**: Use Mermaid syntax for architecture and data flow diagrams.
  - **Links**: Use Markdown link syntax for links to related documents and resources within sections.
    - Example: `[Link Text](https://github.com/owner/repo/wiki/Category-PageName)`
- **Language Support**: 
  - Add language switcher at the top of Home pages
  - Maintain consistent structure across languages
  - Update all internal links when using the naming convention
- **Consistency**: Each section should use the same format and style.
- **Source Attribution**: Clearly indicate which files in the repository the information was derived from using GitHub Permalinks.
  - Always use permalinks to the `main` branch, not commit hashes
  - Format: `https://github.com/owner/repo/blob/main/path/to/file.ext#L123`
  - Example: `Source: [package.json#L36](https://github.com/owner/repo/blob/main/package.json#L36)`
