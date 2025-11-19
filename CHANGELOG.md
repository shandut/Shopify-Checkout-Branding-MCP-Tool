# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-19

### Added
- New `shopify_upload_custom_font_from_url` tool for uploading custom fonts
- Support for WOFF, WOFF2, TTF, and OTF font formats
- Auto-detection of font MIME types from file extensions
- Configurable font weights (100-900) and loading strategies
- Comprehensive custom font documentation and examples
- Font loading strategies (BLOCK, SWAP, FALLBACK, OPTIONAL)

### Fixed
- Corrected resource type for font uploads (FILE instead of GENERIC_FILE)
- Fixed contentType in fileCreate mutation for fonts

### Documentation
- Added detailed custom font usage examples in `examples/custom-font-example.md`
- Updated README with custom font features and workflows
- Enhanced tool descriptions with font configuration examples

## [1.0.0] - 2025-11-19

### Initial Release
- Complete Shopify checkout branding management
- List checkout profiles (TEST/PUBLISHED)
- Read and update checkout branding configurations
- Upload logo images from URLs
- Comprehensive design system support:
  - Colors, typography, corner radius, shadows
  - Header, footer, main, order summary customizations
  - Button and form control styling
  - Background images and dividers
- Intelligent value mapping for API compatibility
- Safety feature: defaults to TEST profile
- MCP (Model Context Protocol) server implementation
- HTTP API for local development
- Support for API versions 2024-10 through 2026-01
