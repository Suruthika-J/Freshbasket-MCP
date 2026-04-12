// assets/dummyStyles.js
// ─── All styles use CSS variables from index.css so they adapt to Light/Dark theme ───

export const bannerStyles = {
  backgroundGradient: "absolute inset-0 fb-bg z-0",
  decorativeCircle: "hidden absolute rounded-full",
  tag: "inline-block px-3 py-1 rounded-full mb-3 border text-sm font-medium fb-badge-success",
  heading: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold fb-text mb-4",
  headingItalic: "font-serif italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl fb-text-primary",
  paragraph: "text-sm sm:text-base md:text-lg fb-text-secondary mb-6 mx-auto md:mx-0 max-w-md md:max-w-lg",
  form: "relative max-w-md mx-auto md:mx-0 mb-6",
  input: "w-full py-3 sm:py-4 px-4 pr-12 rounded-2xl fb-border focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm fb-input",
  searchButton: "absolute right-2 top-1/2 transform -translate-y-1/2 fb-btn-primary p-2 rounded-full",
  featureIcon: "h-6 w-6 fb-text-primary",
  featureItem: "fb-card rounded-xl p-2 sm:p-3 flex flex-col items-center hover:shadow-md transition-shadow",
  featureText: "fb-text font-medium text-xs sm:text-sm",
  imageContainer: "z-10 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-md w-full transform transition-transform duration-500 hover:scale-[1.02]",
  imageInner: "rounded-xl overflow-hidden w-full h-48 sm:h-56 md:h-64 lg:h-[350px] shadow-lg border-4 fb-border"
};

// assets/cartStyles.js
export const cartStyles = {
  pageContainer: "min-h-screen fb-bg py-12 px-4",
  maxContainer: "container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8",
  maxContainerLarge: "container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8",
  continueShopping: "inline-flex cursor-pointer items-center fb-text-primary hover:opacity-80 mb-8 text-sm sm:text-base transition-opacity",
  emptyCartContainer: "fb-card rounded-2xl p-6 sm:p-8 text-center",
  emptyCartIcon: "fb-text-primary text-4xl sm:text-5xl mb-4",
  emptyCartHeading: "text-2xl sm:text-3xl font-bold fb-text mb-3",
  emptyCartText: "fb-text-secondary mb-6 max-w-md mx-auto text-sm sm:text-base",
  emptyCartButton: "inline-block cursor-pointer fb-btn-primary font-bold py-2.5 px-6 sm:py-3 sm:px-8 transition-all duration-300 hover:scale-[1.03] text-sm sm:text-base",
  headerContainer: "text-center mb-10",
  headerTitle: "text-3xl sm:text-4xl font-bold fb-text mt-8 sm:mt-12",
  clearCartButton: "fb-text-primary mt-2 cursor-pointer hover:text-red-500 flex justify-center items-center text-sm sm:text-base transition-colors",
  cartGrid: "fb-cart-layout",
  cartItemsSection: "min-w-0",
  cartItemsGrid: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  cartItemCard: "fb-card rounded-2xl p-5 sm:p-6 flex flex-col items-center",
  cartItemImageContainer: "w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden fb-surface-alt flex items-center justify-center mb-4",
  cartItemImage: "object-contain w-12 h-12 sm:w-16 sm:h-16",
  cartItemName: "font-bold fb-text text-base sm:text-lg mb-2 text-center",
  cartItemPrice: "fb-text-primary mb-4 text-sm sm:text-base font-semibold",
  cartItemQuantityContainer: "flex items-center space-x-4 mb-4",
  cartItemQuantityButton: "p-2 cursor-pointer fb-text-primary hover:opacity-70 transition-opacity",
  cartItemQuantity: "fb-text w-6 sm:w-8 text-center font-semibold",
  cartItemRemoveButton: "flex items-center cursor-pointer fb-text-primary hover:text-red-500 text-sm sm:text-base transition-colors",
  orderSummaryCard: "fb-card rounded-2xl p-5 sm:p-6",
  orderSummaryTitle: "text-lg sm:text-xl font-bold fb-text mb-6",
  orderSummaryRow: "flex justify-between",
  orderSummaryLabel: "fb-text-secondary",
  orderSummaryValue: "fb-text",
  orderSummaryDivider: "h-px fb-divider my-4",
  orderSummaryTotalRow: "flex justify-between text-base sm:text-lg font-bold",
  orderSummaryTotalLabel: "fb-text",
  orderSummaryTotalValue: "fb-text",
  checkoutButton: "mt-6 sm:mt-8 w-full fb-btn-primary font-bold py-3 sm:py-4 cursor-pointer rounded-xl transition-all duration-300 text-sm sm:text-base",
  continueShoppingBottom: "mt-4 sm:mt-6 text-center"
};

// assets/contactStyles.js
const contactStyles = {
  pageContainer: "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden",
  toast: "fixed top-17 right-6 bg-green-600 text-white inline-flex items-center px-4 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap hover:opacity-90 transition-opacity duration-200",
  centeredContainer: "w-full max-w-md z-10",
  headingContainer: "flex flex-col items-center justify-center mt-15",
  heading: "text-4xl sm:text-5xl font-semibold text-center fb-text whitespace-nowrap",
  divider: "w-32 h-1 rounded-full mt-4",
  contactFormContainer: "contact-form-container relative overflow-hidden",
  form: "space-y-6 relative z-10",
  formField: "form-field",
  inputContainer: "relative",
  inputIconContainer: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
  inputIcon: "h-5 w-5 fb-text-primary",
  textareaIconContainer: "absolute top-3 left-3",
  formInput: "form-input",
  formTextarea: "form-textarea",
  submitButton: "submit-button",
  submitButtonText: "font-semibold text-xl mr-2",
  customCSS: `@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Poppins:wght@400;600&display=swap');
  
  .font-cursive {
    font-family: 'Dancing Script', cursive;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .contact-form-container {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    backdrop-filter: blur(8px);
    border-radius: 20px;
    box-shadow: var(--shadow-card-hover);
    padding: 30px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .contact-form-container:hover {
    box-shadow: var(--shadow-card-hover);
  }
  
  .form-field {
    position: relative;
    transition: all 0.3s ease;
  }
  
  .form-field:hover {
    transform: translateY(-2px);
  }
  
  .form-input, .form-textarea {
    width: 100%;
    padding: 15px 15px 15px 45px;
    border: 1.5px solid var(--color-input-border);
    border-radius: 12px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: var(--color-input-bg);
    font-family: 'Poppins', sans-serif;
    color: var(--color-text);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .form-input::placeholder, .form-textarea::placeholder {
    color: var(--color-text-muted);
  }
  
  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px rgba(46,125,50,0.15), inset 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .form-textarea {
    min-height: 150px;
    padding-left: 45px;
  }
  
  .submit-button {
    width: 100%;
    background: var(--color-btn-primary-bg);
    color: var(--color-btn-primary-text);
    padding: 16px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(46,125,50,0.2);
    font-weight: 600;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    font-family: 'Poppins', sans-serif;
  }
  
  .submit-button:hover {
    background: var(--color-btn-primary-hover);
    transform: translateY(-3px);
    box-shadow: 0 7px 14px rgba(46,125,50,0.3);
  }
  
  .submit-button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(46,125,50,0.2);
  }`
};

export const aboutStyles = {
  heroSection: "relative py-20 overflow-hidden fb-bg-secondary",
  heroContainer: "container mx-auto px-4 flex flex-col md:flex-row items-center",
  heroTextContent: "md:w-1/2 text-center md:text-left z-10",
  heroTitle: "text-4xl md:text-6xl font-extrabold fb-text mb-6 leading-tight",
  heroHighlight: "fb-text-primary",
  heroTagline: "text-lg md:text-xl fb-text-secondary mb-8 max-w-lg mx-auto md:mx-0",
  heroIllustration: "md:w-1/2 mt-12 md:mt-0 flex justify-center relative",
  
  missionSection: "py-20 fb-surface",
  missionContainer: "container mx-auto px-4 flex flex-col md:flex-row-reverse items-center gap-12",
  missionText: "md:w-1/2",
  missionTitle: "text-3xl md:text-4xl font-bold fb-text mb-6",
  missionParagraph: "text-lg fb-text-secondary leading-relaxed mb-6",
  
  whyChooseSection: "py-20 fb-bg",
  grid: "grid grid-cols-1 md:grid-cols-3 gap-8",
  card: "fb-card p-8 rounded-3xl text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl",
  cardIcon: "w-16 h-16 mx-auto mb-6 bg-fb-primary-subtle rounded-2xl flex items-center justify-center text-3xl fb-text-primary",
  cardTitle: "text-xl font-bold fb-text mb-4",
  cardText: "fb-text-secondary",
  
  featuresSection: "py-20 fb-bg-secondary/50",
  featureItem: "flex items-center space-x-4 p-6 fb-card rounded-2xl",
  featureIcon: "text-4xl fb-text-primary",
  
  teamSection: "py-20 fb-surface",
  teamGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8",
  teamMember: "text-center group",
  teamAvatar: "w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 border-4 fb-border group-hover:fb-border-primary transition-colors",
  teamName: "font-bold fb-text text-lg",
  teamRole: "fb-text-secondary text-sm",
  
  ctaSection: "py-20 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-center rounded-[3rem] mx-4 mb-20",
  ctaTitle: "text-3xl md:text-5xl font-black mb-8 text-white",
  ctaButton: "bg-white text-green-700 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl",
  
  blob: "absolute rounded-full filter blur-3xl opacity-20 animate-pulse",
};

export default contactStyles;


// assets/footerStyles.js
export const footerStyles = {
  footer: "fb-footer pt-12 pb-8 relative overflow-hidden border-t-4",
  topBorder: "hidden md:block absolute top-0 left-0 w-full h-1 z-20",
  floatingShape: "hidden lg:block absolute rounded-full opacity-10",
  pattern: "absolute inset-0 opacity-5",
  container: "container mx-auto px-4 relative z-10",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12",
  brandTitle: "text-2xl sm:text-3xl font-bold tracking-wider mb-4",
  brandSpan: "opacity-80",
  brandText: "opacity-80 mb-6 leading-relaxed text-sm sm:text-base",
  socialLink: "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-transform transform hover:-translate-y-1 shadow-md opacity-80 hover:opacity-100",
  socialIcon: "",
  sectionTitle: "text-xl sm:text-2xl font-bold mb-4 pb-2 border-b-2 inline-flex items-center",
  sectionIcon: "mr-2 opacity-70",
  linkList: "space-y-2 text-sm sm:text-base",
  linkItem: "flex items-center group hover:opacity-100 opacity-80 transition-opacity",
  linkBullet: "inline-block w-2 h-2 rounded-full mr-3 group-hover:scale-125 transition-transform",
  contactItem: "flex items-start",
  contactIconContainer: "mt-1 p-2 rounded-lg mr-3 opacity-80",
  contactIcon: "",
  newsletterText: "opacity-80 mb-4 text-sm sm:text-base",
  newsletterForm: "flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4",
  newsletterInput: "w-full sm:flex-1 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none px-4 py-2 placeholder-opacity-60 focus:outline-none mb-2 sm:mb-0",
  newsletterButton: "w-full sm:w-auto px-4 py-2 rounded-b-xl sm:rounded-r-xl sm:rounded-bl-none flex items-center justify-center transition-transform transform hover:-translate-y-1",
  privacyText: "opacity-60 text-xs sm:text-sm",
  paymentSection: "border-t-2 border-opacity-20 pt-6",
  paymentTitle: "opacity-70 mb-4 font-medium flex items-center justify-center text-sm sm:text-base",
  paymentIcon: "mr-2 opacity-70 text-lg",
  paymentMethods: "flex flex-wrap justify-center gap-4",
  paymentItem: "p-3 rounded-lg hover:opacity-100 opacity-70 transition-all transform hover:-translate-y-1",
  attribution: "mt-8 text-center",
  attributionBadge: "inline-flex items-center px-6 py-3 rounded-full border border-opacity-20 shadow-lg",
  hexagonContainer: "relative mr-3",
  hexagon: "w-6 h-6 rounded-sm transform rotate-45",
  hexagonInner: "absolute inset-0 flex items-center justify-center",
  hexagonInnerShape: "w-3 h-3 bg-white transform -rotate-45",
  attributionText: "opacity-80 text-sm sm:text-base",
  attributionLink: "font-bold underline hover:opacity-100 opacity-90",
  customCSS: `@keyframes pulse-slow {
    0% { opacity: 0.05; }
    50% { opacity: 0.12; }
    100% { opacity: 0.05; }
  }
  @keyframes float {
    0% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(10deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }
  .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
  .animate-float { animation: float 8s ease-in-out infinite; }
  .animation-delay-1000 { animation-delay: 1s; }
  .animation-delay-2000 { animation-delay: 2s; }
  .animation-delay-3000 { animation-delay: 3s; }`
};

// assets/itemsPageStyles.js
export const itemsPageStyles = {
  page: "min-h-screen fb-bg",
  container: "container mx-auto px-4 py-8",
  header: "mb-12 text-center py-8 relative",
  backLink: "absolute top-5 left-0 flex items-center fb-text-primary hover:opacity-70 cursor-pointer transition-opacity",
  mainTitle: "text-5xl font-bold fb-text mt-7",
  titleSpan: "fb-text-primary",
  subtitle: "fb-text-secondary mt-4 max-w-2xl mx-auto text-lg",
  titleDivider: "mt-8 flex justify-center",
  dividerLine: "w-24 h-1 rounded-full",
  searchContainer: "mb-10 max-w-2xl mx-auto",
  searchForm: "relative",
  searchInput: "w-full py-3 px-4 pr-12 rounded-2xl fb-input shadow-inner",
  searchButton: "absolute right-2 top-1/2 transform -translate-y-1/2 fb-btn-primary p-2 rounded-full",
  expandButton: "flex items-center fb-surface hover:fb-surface-alt cursor-pointer fb-text py-3 px-6 rounded-full transition-all shadow-md fb-border border",
  categorySection: "mb-16",
  categoryHeader: "flex items-center mb-8",
  categoryIcon: "w-3 h-8 rounded-full mr-3",
  categoryTitle: "text-3xl font-bold fb-text",
  categoryDivider: "ml-4 flex-1 h-px",
  productsGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8",
  showMoreButton: "flex items-center fb-btn-primary py-3 px-6 rounded-full transition-all shadow-lg cursor-pointer",
  noProductsContainer: "text-center py-16",
  noProductsCard: "fb-card p-8 rounded-2xl max-w-md mx-auto",
  noProductsIcon: "fb-text-primary mb-4",
  noProductsTitle: "text-xl font-bold fb-text mb-2",
  noProductsText: "fb-text-secondary mb-6",
  clearSearchButton: "fb-btn-primary cursor-pointer px-6 py-3 rounded-full font-medium shadow-md hover:shadow-lg transition-all",

  // ProductCard styles
  productCard: "h-full flex flex-col fb-card rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1",
  imageContainer: "h-48 relative overflow-hidden fb-surface-alt flex items-center justify-center",
  productImage: "object-contain w-full h-full transition-transform duration-500",
  cardContent: "p-5 flex-1 flex flex-col",
  titleContainer: "flex justify-between items-start",
  productTitle: "font-bold fb-text text-lg truncate max-w-[70%]",
  organicTag: "text-xs fb-badge-success px-2 py-1 rounded-full font-medium",
  productDescription: "mt-2 fb-text-secondary text-sm h-12 overflow-hidden",
  priceContainer: "mt-auto pt-4 flex justify-between items-center",
  currentPrice: "fb-text font-bold text-xl",
  oldPrice: "fb-text-muted line-through text-sm",
  quantityControls: "flex items-center justify-between rounded-full overflow-hidden",
  quantityButton: "p-3 cursor-pointer transition-colors",
  quantityButtonLeft: "rounded-l-full",
  quantityButtonRight: "rounded-r-full",
  quantityValue: "font-bold",
  addButton: "w-full fb-btn-primary cursor-pointer py-3 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-[1.02] group font-bold shadow-lg",
  addButtonArrow: "ml-2 text-xl transform group-hover:translate-x-1 transition-transform"
};

export const checkoutStyles = {
  page: "min-h-screen fb-bg",
  container: "container mx-auto px-4 py-8",
  backLink: "inline-flex items-center fb-text-primary hover:opacity-70 mb-6 transition-opacity",
  header: "mb-8",
  mainTitle: "text-4xl md:text-5xl font-bold fb-text mb-2",
  subtitle: "fb-text-secondary mb-8",
  card: "fb-card rounded-2xl p-6",
  sectionTitle: "text-xl font-bold fb-text mb-6 flex items-center",
  input: "fb-input w-full px-4 py-3 rounded-xl",
  inputError: "border-red-500",
  radioCard: "flex items-center p-4 border fb-border rounded-xl cursor-pointer hover:border-green-500 transition-colors fb-surface",
  cartItem: "flex items-center border-b fb-border pb-4 last:border-0",
  cartImage: "fb-surface-alt border-2 border-dashed fb-border rounded-xl w-16 h-16 mr-4 flex items-center justify-center",
  summaryCard: "fb-card border fb-border rounded-xl p-4",
  infoCard: "fb-card border fb-border rounded-xl p-4",
  button: "w-full py-3 px-6 rounded-xl font-medium flex items-center justify-center transition-colors shadow-lg",
  submitButton: "fb-btn-primary",
  disabledButton: "opacity-50 cursor-not-allowed",
  link: "fb-text-primary hover:opacity-70 hover:underline transition-opacity",
  emptyPage: "min-h-screen flex items-center justify-center fb-bg p-4",
  emptyCard: "max-w-md w-full fb-card rounded-2xl p-8 text-center",
  emptyIcon: "fb-text-primary text-6xl mb-4",
  emptyTitle: "text-2xl font-bold fb-text mb-2",
  emptyText: "fb-text-secondary mb-6",
  emptyButton: "inline-flex items-center fb-btn-primary font-medium py-2 px-6 rounded-full transition-colors shadow-lg",
  deliveryInfo: "mt-8 p-6 rounded-2xl border",
  deliveryTitle: "font-bold flex items-center mb-2",
  deliveryText: "fb-text-secondary"
};

// Styles object matching the requested theme
export const ordersPageStyles = {
  page: "min-h-screen fb-bg",
  container: "container mx-auto px-4 py-8",
  header: "mb-8 text-center py-8 relative",
  backLink: "absolute top-5 left-0 flex items-center fb-text-primary hover:opacity-70 cursor-pointer transition-opacity",
  mainTitle: "text-4xl md:text-5xl font-bold fb-text mt-7",
  titleSpan: "fb-text-primary",
  subtitle: "fb-text-secondary mt-4 max-w-2xl mx-auto text-lg",
  titleDivider: "mt-6 flex justify-center",
  dividerLine: "w-24 h-1 rounded-full",
  searchContainer: "mb-8 max-w-2xl mx-auto",
  searchForm: "relative",
  searchInput: "fb-input w-full py-3 px-4 pr-12 rounded-2xl shadow-inner",
  searchButton: "absolute right-2 top-1/2 transform -translate-y-1/2 fb-text-primary hover:opacity-70 transition-opacity",
  ordersTable: "fb-card rounded-2xl overflow-hidden",
  tableHeader: "fb-table-header",
  tableHeaderCell: "py-4 px-4 text-left text-sm font-semibold fb-text-secondary",
  tableRow: "fb-table-row transition-colors",
  tableCell: "py-4 px-4 fb-text",
  statusBadge: "px-3 py-1 rounded-full text-xs font-medium",
  actionButton: "text-sm fb-btn-primary py-1.5 px-4 rounded-full transition-colors shadow-md",
  modalOverlay: "fixed inset-0 flex items-center justify-center p-4 z-50 fb-overlay",
  modalContainer: "fb-modal w-full max-w-4xl max-h-[90vh] overflow-y-auto",
  modalHeader: "sticky top-0 fb-surface border-b fb-border p-6 z-10",
  modalTitle: "text-2xl font-bold fb-text",
  modalCloseButton: "fb-text-secondary hover:fb-text transition-colors",
  modalBody: "p-6",
  modalSection: "mb-8",
  modalSectionTitle: "text-lg font-bold fb-text mb-4 flex items-center",
  modalCard: "fb-surface-alt rounded-xl p-4 border fb-border",
  modalFooter: "sticky bottom-0 fb-surface border-t fb-border p-6",
  closeButton: "px-6 py-2 fb-btn-primary rounded-full transition-colors shadow-lg font-medium"
};


// assets/itemsHomeStyles.js
export const itemsHomeStyles = {
  page: "flex flex-col min-h-screen fb-bg",
  sidebar: "hidden lg:flex w-64 rounded-r-3xl text-white p-4 shadow-2xl flex-col",
  sidebarHeader: "text-center mb-8 mt-4",
  sidebarTitle: "text-4xl font-bold tracking-tighter text-white",
  sidebarDivider: "w-32 h-1 mx-auto mt-2 rounded-full bg-white opacity-40",
  categoryList: "flex-1 overflow-y-auto pr-2",
  categoryItem: "w-full cursor-pointer flex items-center p-4 rounded-xl transition-transform transform hover:scale-105",
  categoryIcon: "p-3 rounded-full bg-white bg-opacity-20",
  categoryName: "ml-4 text-lg text-white",
  mainContent: "flex-1 p-6 overflow-y-auto",
  mobileCategories: "lg:hidden mb-6 overflow-x-auto",
  mobileCategoryItem: "whitespace-nowrap px-4 py-2 rounded-full border-2 transition-colors",
  searchResults: "text-center mb-6 fb-card rounded-xl p-4 shadow-sm max-w-2xl mx-auto",
  sectionTitle: "text-3xl font-bold fb-text-primary capitalize mb-2",
  sectionDivider: "w-32 h-1 mx-auto rounded-full mb-6",
  productsGrid: "fb-products-grid mb-10",
  productCard: "h-full flex flex-col fb-card rounded-2xl overflow-hidden transition-transform duration-300 transform hover:-translate-y-1",
  imageContainer: "w-full h-40 sm:h-52 fb-surface-alt flex items-center justify-center",
  productImage: "max-h-full object-cover transition-transform duration-300",
  productContent: "p-5 flex-1 flex flex-col",
  productTitle: "font-bold text-lg fb-text text-center mb-2 line-clamp-1",
  priceContainer: "mt-auto pt-4 flex justify-between items-center",
  currentPrice: "fb-text-primary font-bold text-xl",
  oldPrice: "fb-text-muted text-sm line-through",
  addButton: "fb-btn-primary cursor-pointer px-4 py-2 rounded-full flex items-center transition-shadow shadow-md hover:shadow-lg",
  quantityControls: "flex items-center space-x-2",
  quantityButton: "p-2 cursor-pointer fb-primary-subtle fb-text-primary rounded-full hover:opacity-80 transition-opacity",
  noProducts: "col-span-full text-center py-12",
  noProductsText: "fb-text-primary font-medium text-xl mb-4",
  clearSearchButton: "fb-btn-primary cursor-pointer px-6 py-3 rounded-full font-medium shadow-md hover:shadow-lg transition-all",
  viewAllButton: "fb-btn-primary cursor-pointer px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-transform duration-300 inline-flex items-center text-lg",
  activeCategory: "bg-white bg-opacity-25 text-white font-bold shadow-lg border-l-4 border-white",
  inactiveCategory: "opacity-70 hover:opacity-100 hover:bg-white hover:bg-opacity-10",
  activeMobileCategory: "fb-btn-primary border-transparent",
  inactiveMobileCategory: "fb-surface fb-text-primary fb-border"
};

// assets/loginStyles.js
export const loginStyles = {
  page: "relative w-full min-h-screen fb-bg flex items-center justify-center overflow-hidden px-4 sm:px-6 md:px-8 lg:px-4",
  backLink: "absolute top-4 left-4 mt-19 flex items-center fb-text hover:fb-text-primary z-20 transition-colors",
  toast: "fixed top-16 right-6 bg-green-600 text-white inline-flex items-center px-4 py-2 rounded-lg shadow-lg z-50",
  loginCard: "mt-8 w-full max-w-sm sm:max-w-sm md:max-w-md lg:max-w-sm fb-card p-6 sm:p-8 md:p-10 lg:p-6 rounded-2xl flex-shrink-0 z-10",
  logoContainer: "flex justify-center mb-6",
  logoOuter: "w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg",
  logoInner: "w-12 h-12 sm:w-16 sm:h-16 fb-surface rounded-full flex items-center justify-center",
  logoIcon: "text-xl sm:text-3xl fb-text-primary",
  title: "text-center text-lg sm:text-xl font-semibold fb-text mb-4",
  form: "space-y-4",
  inputContainer: "relative",
  inputIcon: "absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none fb-text-muted text-base",
  input: "fb-input w-full !pl-11 pr-4 py-2.5 rounded-lg",
  passwordInput: "fb-input w-full !pl-11 !pr-11 py-2.5 rounded-lg",
  toggleButton: "absolute right-3 top-1/2 -translate-y-1/2 z-10 fb-text-muted hover:fb-text-primary transition-colors cursor-pointer",
  rememberContainer: "flex items-center justify-between text-sm",
  rememberLabel: "flex items-center fb-text",
  rememberCheckbox: "mr-2 h-4 w-4 cursor-pointer accent-green-600",
  forgotLink: "fb-text-primary hover:opacity-70 transition-opacity",
  error: "text-xs text-red-500",
  submitButton: "w-full py-2.5 fb-btn-primary font-medium rounded-lg transition-all",
  signupText: "text-center text-sm fb-text-secondary mt-6",
  signupLink: "fb-text-primary hover:opacity-70 transition-opacity"
};

// assets/navbarStyles.js
export const navbarStyles = {
  nav: "fixed w-full z-50 transition-all duration-500 fb-navbar",
  scrolledNav: "h-16 shadow-lg",
  unscrolledNav: "h-20",
  borderGradient: "absolute bottom-0 left-0 right-0 h-[1px]",
  particlesContainer: "absolute inset-0 overflow-hidden pointer-events-none",
  particle: "absolute rounded-full",
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  innerContainer: "flex justify-between items-center h-20",
  logoLink: "flex items-center space-x-3 group transition-transform duration-300 hover:scale-[1.02]",
  logoImage: "transition-all duration-500",
  logoText: "text-2xl font-bold fb-text-primary tracking-tight",
  desktopNav: "hidden lg:flex items-center space-x-8",
  navItem: "relative font-medium flex flex-col items-center py-2 transition-all duration-300 group",
  activeNavItem: "fb-text-primary",
  inactiveNavItem: "fb-text-secondary hover:fb-text-primary",
  navIcon: "mr-2 transition-transform",
  activeNavIcon: "scale-125",
  inactiveNavIcon: "group-hover:scale-110",
  navIndicator: "absolute -bottom-1 h-0.5 rounded-full transition-all duration-500",
  activeIndicator: "w-full opacity-100",
  inactiveIndicator: "w-0 opacity-0 group-hover:w-full group-hover:opacity-100",
  iconsContainer: "flex items-center space-x-5",
  loginLink: "hidden lg:inline-flex p-2.5 rounded-full hover:fb-primary-subtle transition-colors group",
  loginIcon: "h-5 w-5 fb-text-secondary group-hover:fb-text-primary transition-colors",
  cartLink: "relative p-2.5 rounded-full hover:fb-primary-subtle transition-colors",
  cartIcon: "h-5 w-5 fb-text-secondary hover:fb-text-primary transition-transform",
  cartBadge: "absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white rounded-full transform transition-transform duration-300 hover:scale-110",
  hamburgerButton: "lg:hidden ml-2 p-2 rounded-full fb-text-secondary hover:fb-surface-alt transition-colors",
  mobileOverlay: "lg:hidden fixed inset-0 z-40 transition-all duration-500",
  mobilePanel: "absolute top-0 right-0 h-full w-4/5 max-w-xs shadow-2xl transform transition-transform duration-500 ease-in-out fb-surface",
  mobileHeader: "flex items-center justify-between p-5 border-b fb-border",
  mobileLogo: "flex items-center space-x-2",
  mobileLogoImage: "h-10 w-10",
  mobileLogoText: "text-xl font-bold fb-text-primary",
  closeButton: "p-2 rounded-full transition-colors hover:fb-surface-alt",
  mobileItemsContainer: "p-4 space-y-2",
  mobileItem: "flex items-center fb-surface-alt p-4 rounded-xl transition-all duration-300 hover:fb-primary-subtle fb-text hover:fb-text-primary",
  mobileItemIcon: "mr-3 text-lg fb-text-primary",
  mobileItemText: "text-lg fb-text",
  mobileButtons: "pt-4 mt-4 grid grid-cols-2 gap-3 border-t fb-border",
  loginButton: "col-span-2 flex items-center justify-center p-3 fb-btn-primary rounded-xl hover:shadow-lg transition-all duration-300 group",
  loginButtonIcon: "mr-2 transform group-hover:scale-110 transition-transform",
  floatAnimation: "animate-float",
  floatSlowAnimation: "animate-float-slow",
  floatSlowerAnimation: "animate-float-slower",
  customCSS: `@keyframes float {
    0% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(10deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }
  .animate-float { animation: float 8s ease-in-out infinite; }
  .animate-float-slow { animation: float 12s ease-in-out infinite; }
  .animate-float-slower { animation: float 16s ease-in-out infinite; }`
};

// assets/signupStyles.js
export const signupStyles = {
  page: "relative w-full min-h-screen fb-bg flex items-center justify-center overflow-hidden px-4 sm:px-6 md:px-8 lg:px-4",
  backLink: "absolute top-4 left-4 mt-19 flex items-center fb-text hover:fb-text-primary z-20 transition-colors",
  toast: "fixed top-16 right-6 bg-green-600 text-white inline-flex items-center px-4 py-2 rounded-lg shadow-lg z-50",
  signupCard: "mt-8 w-full max-w-[90%] sm:max-w-sm md:max-w-md lg:max-w-sm fb-card p-6 sm:p-8 md:p-10 lg:p-6 rounded-2xl flex-shrink-0 z-10",
  logoContainer: "flex justify-center mb-6",
  logoOuter: "w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg",
  logoInner: "w-12 h-12 sm:w-16 sm:h-16 fb-surface rounded-full flex items-center justify-center",
  logoIcon: "text-xl sm:text-3xl fb-text-primary",
  title: "text-center text-lg sm:text-xl font-semibold fb-text mb-4",
  form: "space-y-4",
  inputContainer: "relative",
  inputIcon: "absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none fb-text-muted text-base",
  input: "fb-input w-full !pl-11 pr-4 py-2.5 rounded-lg",
  passwordInput: "fb-input w-full !pl-11 !pr-11 py-2.5 rounded-lg",
  toggleButton: "absolute right-3 top-1/2 -translate-y-1/2 z-10 fb-text-muted hover:fb-text-primary transition-colors cursor-pointer",
  error: "text-xs text-red-500 mt-1",
  termsContainer: "flex items-center text-sm",
  termsLabel: "flex items-center fb-text",
  termsCheckbox: "mr-2 h-4 w-4 cursor-pointer accent-green-600",
  submitButton: "w-full py-2.5 fb-btn-primary font-medium rounded-lg transition-all",
  signinText: "text-center text-sm fb-text-secondary mt-6",
  signinLink: "fb-text-primary hover:opacity-70 transition-opacity"
};


// src/assets/dummyStyles.js
export const userOrdersPageStyles = {
  page: "min-h-screen fb-bg p-4 md:p-8",
  container: "max-w-6xl mx-auto",
  header: "mb-8",
  backLink: "inline-flex items-center fb-text-primary hover:opacity-70 mb-4 transition-opacity",
  mainTitle: "text-3xl md:text-4xl font-bold fb-text mb-2",
  titleSpan: "fb-text-primary",
  subtitle: "fb-text-secondary",
  titleDivider: "w-full flex justify-center my-6",
  dividerLine: "w-24 h-1 rounded-full",
  searchContainer: "mb-8",
  searchForm: "relative max-w-md mx-auto",
  searchInput: "fb-input w-full rounded-full py-3 pl-5 pr-12",
  searchButton: "absolute right-3 top-1/2 transform -translate-y-1/2 fb-text-primary hover:opacity-70 transition-opacity",
  ordersTable: "fb-card rounded-2xl p-6",
  tableHeader: "fb-table-header",
  tableHeaderCell: "py-3 px-4 text-left text-sm font-semibold fb-text-secondary",
  tableRow: "fb-table-row transition-colors",
  tableCell: "py-4 px-4 fb-text",
  statusBadge: "inline-flex px-3 py-1 rounded-full text-xs font-medium",
  actionButton: "px-4 py-2 fb-primary-subtle fb-text-primary hover:fb-btn-primary rounded-full transition-all text-sm",
  emptyStateCell: "py-12 text-center",
  emptyStateContainer: "flex flex-col items-center justify-center",
  emptyStateIcon: "fb-text-primary text-4xl mb-4",
  emptyStateTitle: "text-lg font-medium fb-text mb-1",
  emptyStateText: "fb-text-secondary",
  modalOverlay: "fixed inset-0 fb-overlay flex items-center justify-center p-4 z-50",
  modalContainer: "fb-modal w-full max-w-4xl max-h-[90vh] overflow-y-auto",
  modalHeader: "sticky top-0 fb-surface border-b fb-border p-6",
  modalTitle: "text-xl font-bold fb-text",
  modalCloseButton: "fb-text-secondary hover:fb-text transition-colors",
  modalBody: "p-6",
  modalSection: "mb-6",
  modalSectionTitle: "flex items-center text-lg font-bold fb-text mb-4",
  modalCard: "fb-surface-alt rounded-xl p-4 border fb-border",
  modalNoteBox: "fb-surface-alt border-l-4 border-green-500 p-4 rounded-lg",
  modalOrderItem: "flex items-center p-4 fb-surface-alt",
  modalOrderImage: "w-16 h-16 object-cover rounded-lg mr-4",
  modalPlaceholderImage: "fb-surface border-2 border-dashed fb-border rounded-xl w-16 h-16 mr-4 flex items-center justify-center",
  modalOrderTotal: "p-4 fb-surface-alt",
  modalFooter: "sticky bottom-0 fb-surface border-t fb-border p-6",
  closeButton: "px-6 py-2 fb-btn-secondary rounded-full transition-all"
};
