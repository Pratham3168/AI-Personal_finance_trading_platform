export const APP_NAME = 'BudgetWise' // change to your product name
// Display only. The backend stores plain numbers and does no currency conversion.
export const CURRENCY = 'INR'

// Redesigned pages. Pages NOT listed here render on a light "legacy sheet" so they stay
// readable in dark mode. Add a path here once that page has been redesigned,
// e.g. ['/transactions'].
export const MIGRATED_ROUTES = ['/home', '/transactions', '/analysis']
