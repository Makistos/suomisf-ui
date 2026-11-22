// Must match PASSWORD_MIN_LENGTH / PASSWORD_MAX_LENGTH in the backend
// (app/impl_users.py), which enforces the rule; this only warns early.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordRules = {
    required: "Salasana on pakollinen",
    minLength: {
        value: PASSWORD_MIN_LENGTH,
        message: `Vähintään ${PASSWORD_MIN_LENGTH} merkkiä`,
    },
    maxLength: {
        value: PASSWORD_MAX_LENGTH,
        message: `Enintään ${PASSWORD_MAX_LENGTH} merkkiä`,
    },
};
