// QuotationFormStyles.js

export const generateQuotationFormStyles = (token) => ({
  // Main Card & Page Layout
  quotationCard: {
    borderRadius: token.borderRadiusXL, // More rounded corners for a softer, modern look
    boxShadow: token.boxShadowSecondary, // Enhanced shadow for depth
    border: `1px solid ${token.colorBorderBg}`, // Subtle border
    backgroundColor: token.colorBgContainer,
    padding: token.paddingLG, // More internal padding
  },
  mainCardTitle: {
    color: token.colorPrimary, // Highlight with primary color
    fontSize: token.fontSizeHeading2, // Larger, more prominent title
    fontWeight: token.fontWeightStronger, // Bolder font
    marginBottom: token.marginLG,
    textAlign: 'center',
    textTransform: 'uppercase', // Make it stand out
    letterSpacing: '1px',
  },

  // Business Info Card - Visual Emphasis
  businessInfoCard: {
    background: `linear-gradient(135deg, ${token.colorFillQuaternary} 0%, ${token.colorFillAlter} 100%)`, // Gradient background
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    padding: token.paddingMD,
    minHeight: '80px', // Increased height for visual weight
    boxShadow: token.boxShadowTertiary,
    marginBottom: token.marginLG, // More space
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease-in-out', // Smooth transitions on hover
    '&:hover': {
      boxShadow: token.boxShadow, // More prominent shadow on hover
      transform: 'translateY(-2px)',
    },
  },
  businessInfoPre: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    flexGrow: 1,
    fontFamily: 'monospace', // Keeping monospace for "info" feel
    fontSize: token.fontSizeSM,
    color: token.colorTextSecondary,
    lineHeight: token.lineHeightSM,
    opacity: 0.8, // Slightly muted for background info
  },

  // Form Fields - Modern and Spacious
  formField: {
    width: '100%',
    borderRadius: token.borderRadiusSM, // Slightly less rounded for inputs
    borderColor: token.colorBorder, // Clearer border
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: token.colorPrimaryBorder, // Primary color on hover
    },
    '&:focus': {
      boxShadow: `0 0 0 2px ${token.colorPrimaryBorderHover}`, // Subtle glow on focus
    }
  },
  readOnlyFormField: {
    width: '100%',
    color: token.colorTextDisabled,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary, // Distinct background for read-only
    cursor: 'not-allowed',
  },
  textAreaField: {
    width: '100%',
    marginBottom: token.marginS,
    borderRadius: token.borderRadiusSM,
    borderColor: token.colorBorder,
  },
  readOnlyTextArea: {
    width: '100%',
    marginBottom: token.marginS,
    borderRadius: token.borderRadiusSM,
    color: token.colorTextDisabled,
    background: token.colorFillQuaternary,
    cursor: 'not-allowed',
  },

  // Dividers - More Artistic Separation
  divider: {
    borderColor: token.colorBorderSecondary,
    borderStyle: 'dashed', // Dashed border for a lighter feel
    margin: `${token.marginXL}px 0`, // More vertical margin
    color: token.colorTextTertiary, // Muted text color
    fontWeight: token.fontWeightStrong,
  },
  specificationDivider: {
    borderColor: token.colorBorderSecondary,
    borderStyle: 'dotted', // Dotted for specifications
    margin: `${token.margin}px 0 ${token.marginS}px 0`,
    color: token.colorTextQuaternary,
  },

  // Item Card - Clean and Interactive
  itemCard: {
    marginBottom: token.marginMD, // Slightly less margin for denser item list
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillContentBackground, // Slight variant for item cards
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      boxShadow: token.boxShadowXl, // More pronounced shadow on hover
      transform: 'translateY(-3px)', // Lift effect
    },
  },

  // Item Action Buttons - Refined Aesthetics
  deleteButton: {
    height: 'auto', // Allow content to dictate height
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorError,
    '&:hover': {
      color: token.colorErrorHover,
      background: token.colorErrorBg,
    },
  },
  addButton: {
    height: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorPrimary,
    borderColor: token.colorPrimaryBorder,
    '&:hover': {
      color: token.colorPrimaryHover,
      borderColor: token.colorPrimaryBorderHover,
      background: token.colorPrimaryBg,
    },
  },
  addSpecButton: {
    marginTop: token.margin,
    borderRadius: token.borderRadiusSM,
    borderColor: token.colorBorderDashed,
    color: token.colorTextSecondary,
    '&:hover': {
      color: token.colorPrimaryText,
      borderColor: token.colorPrimary,
    }
  },
  addItemButton: {
    marginTop: token.marginLG,
    borderRadius: token.borderRadiusSM,
    borderColor: token.colorPrimaryBorderDashed,
    color: token.colorPrimary,
    '&:hover': {
      background: token.colorPrimaryBgHover,
    }
  },

  // Specification Row - Compact
  specificationRow: {
    marginBottom: token.marginXXS,
  },

  // Summary Fields - Prominent Totals
  summaryRow: {
    fontWeight: token.fontWeightStrong,
    borderTop: `1px dashed ${token.colorBorderSecondary}`,
    paddingTop: token.paddingMD,
    marginTop: token.marginLG,
  },
  totalField: {
    width: '100%',
    borderRadius: token.borderRadiusSM,
    textAlign: 'right', // Align numbers to the right
    backgroundColor: token.colorFillTertiary, // Subtle background
    borderColor: token.colorBorder,
    color: token.colorText,
  },
  grandTotalField: {
    width: '100%',
    borderRadius: token.borderRadiusSM,
    color: token.colorSuccess, // Highlight total with a success color
    fontSize: token.fontSizeHeading4, // Larger total font
    fontWeight: token.fontWeightStronger,
    textAlign: 'right',
    backgroundColor: token.colorSuccessBg, // Distinct background for grand total
    borderColor: token.colorSuccessBorder,
  },

  // Notes Section - Visually Separated
  notesCard: {
    background: token.colorFillQuaternary,
    marginBottom: token.margin,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderQuaternary}`,
  },
  noteText: {
    margin: 0,
    paddingBottom: token.paddingXXS,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: 1.5,
  },

  // Button Group
  buttonGroup: {
    marginTop: token.marginLG,
    paddingTop: token.paddingMD,
    borderTop: `1px solid ${token.colorBorderSecondary}`,
    display: 'flex',
    justifyContent: 'flex-end', // Align buttons to the right
    gap: token.marginSM, // Space between buttons
  },
});