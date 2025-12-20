"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingStatus = exports.VerificationStatus = exports.AccountStatus = exports.AccountType = exports.Role = void 0;
var Role;
(function (Role) {
    Role["USER"] = "USER";
    Role["ADMIN"] = "ADMIN";
})(Role || (exports.Role = Role = {}));
var AccountType;
(function (AccountType) {
    AccountType["USER"] = "USER";
    AccountType["ADMIN"] = "ADMIN";
})(AccountType || (exports.AccountType = AccountType = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "ACTIVE";
    AccountStatus["BLOCKED"] = "BLOCKED";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VERIFIED"] = "VERIFIED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var OnboardingStatus;
(function (OnboardingStatus) {
    OnboardingStatus["PENDING"] = "PENDING";
    OnboardingStatus["COMPLETED"] = "COMPLETED";
})(OnboardingStatus || (exports.OnboardingStatus = OnboardingStatus = {}));
