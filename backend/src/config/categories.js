// Fixed category lists keep data clean, which makes AI analysis much more reliable later.
exports.CATEGORIES = {
    expense: [
        'food', 'groceries', 'rent', 'utilities', 'transport', 'fuel', 'shopping',
        'health', 'education', 'entertainment', 'travel', 'emi_loan', 'insurance',
        'subscriptions', 'personal_care', 'gifts_donations', 'savings_investments', 'other',
    ],
    income: ['salary', 'business', 'freelance', 'rental', 'investments', 'bonus', 'gifts', 'other'],
};

exports.PAYMENT_METHODS = ['cash', 'upi', 'card', 'netbanking', 'other'];
