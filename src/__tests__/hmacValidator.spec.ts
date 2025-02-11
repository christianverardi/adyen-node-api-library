import HmacValidator from "../utils/hmacValidator";
import {NotificationRequestItem} from "../typings/notification";
import {HMAC_SIGNATURE} from "../typings/constants/apiConstants";

const key = "DFB1EB5485895CFA84146406857104ABB4CBCABDC8AAF103A624C8F6A3EAAB00";
const expectedSign = "ipnxGCaUZ4l8TUW75a71/ghd2Fe5ffvX0pV4TLTntIc=";
const notificationRequestItem: NotificationRequestItem = {
    pspReference: "pspReference",
    originalReference: "originalReference",
    merchantAccountCode: "merchantAccount",
    merchantReference: "reference",
    amount: {currency: "EUR", value: 1000},
    eventCode: "EVENT",
    eventDate: new Date("01-01-1970"),
    paymentMethod: "VISA",
    reason: "reason",
    success: "true",
    additionalData: { [HMAC_SIGNATURE]: expectedSign },
};

describe("HMAC Validator", function (): void {
    it("should get correct data", function (): void {
        const hmacValidator = new HmacValidator();
        const dataToSign = hmacValidator.getDataToSign({merchantAccount: "ACC", currencyCode: "EUR"});
        expect(dataToSign).toEqual("currencyCode:merchantAccount:EUR:ACC");
    });
    it("should get correct data with escaped characters", function (): void {
        const hmacValidator = new HmacValidator();
        const dataToSign = hmacValidator.getDataToSign({currencyCode: "EUR", merchantAccount: "ACC:\\"});
        expect(dataToSign).toEqual("currencyCode:merchantAccount:EUR:ACC\\:\\\\");
    });
    it("should encrypt correctly", function (): void {
        const data = "countryCode:currencyCode:merchantAccount:merchantReference:paymentAmount:sessionValidity:skinCode:NL:EUR:MagentoMerchantTest2:TEST-PAYMENT-2017-02-01-14\\:02\\:05:199:2017-02-02T14\\:02\\:05+01\\:00:PKz2KML1";
        const key = "DFB1EB5485895CFA84146406857104ABB4CBCABDC8AAF103A624C8F6A3EAAB00";
        const hmacValidator = new HmacValidator();
        const encrypted = hmacValidator.calculateHmac(data, key);
        expect(encrypted).toEqual("34oR8T1whkQWTv9P+SzKyp8zhusf9n0dpqrm9nsqSJs=");
    });
    it("should get correct data to sign", function (): void {
        const hmacValidator = new HmacValidator();
        const data = hmacValidator.getDataToSign(notificationRequestItem);
        expect(data).toEqual("pspReference:originalReference:merchantAccount:reference:1000:EUR:EVENT:true");
    });

    it("should have valid hmac", function (): void {
        const hmacValidator = new HmacValidator();
        const encrypted = hmacValidator.calculateHmac(notificationRequestItem, key);
        expect(expectedSign).toEqual(encrypted);
        expect(hmacValidator.validateHMAC(notificationRequestItem, key)).toBeTruthy();
    });

    it("should have invalid hmac", function (): void {
        const invalidNotification = {
            ...notificationRequestItem,
            additionalData: { [HMAC_SIGNATURE]: "notValidSign" }
        };
        const hmacValidator = new HmacValidator();
        const result = hmacValidator.validateHMAC(invalidNotification, key);
        expect(result).toBeFalsy();
    });
});