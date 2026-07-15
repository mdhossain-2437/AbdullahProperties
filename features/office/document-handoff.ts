export type OfficeDocumentHandoffInput = Readonly<{
  documentType: "invoice" | "payment receipt" | "notice";
  documentNumber: string;
  verificationUrl: string | null;
  locale: "en" | "bn";
}>;

export type OfficeDocumentHandoff = Readonly<{
  subject: string;
  message: string;
}>;

export function buildOfficeDocumentHandoff(
  input: OfficeDocumentHandoffInput,
): OfficeDocumentHandoff {
  if (input.locale === "bn") {
    const labels = {
      invoice: "ইনভয়েস",
      "payment receipt": "পেমেন্ট রসিদ",
      notice: "নোটিশ",
    } as const;
    const documentLabel = labels[input.documentType];
    const introduction = input.documentType === "payment receipt"
      ? `আপনার পেমেন্টের রসিদ ${input.documentNumber} আব্দুল্লাহ প্রোপার্টিজ থেকে প্রস্তুত করা হয়েছে।`
      : `আব্দুল্লাহ প্রোপার্টিজ থেকে ${documentLabel} ${input.documentNumber} প্রস্তুত করা হয়েছে।`;
    const verification = input.verificationUrl
      ? `\n\nনথিটি যাচাই করুন: ${input.verificationUrl}`
      : "\n\nএই খসড়াটির জন্য এখনো অনলাইন যাচাই লিংক তৈরি হয়নি।";

    return {
      subject: `আব্দুল্লাহ প্রোপার্টিজের ${documentLabel} ${input.documentNumber}`,
      message:
        `${introduction}${verification}` +
        "\n\nকোনো PDF স্বয়ংক্রিয়ভাবে সংযুক্ত হয়নি। প্রয়োজন হলে সংরক্ষিত PDF-টি নিজে সংযুক্ত করুন।",
    };
  }

  const typeLabel = input.documentType.replace(/^./, (character) => character.toUpperCase());
  const verification = input.verificationUrl
    ? `\n\nVerify this record: ${input.verificationUrl}`
    : "\n\nThis draft does not yet have a public verification link.";

  return {
    subject: `Abdullah Properties ${input.documentType} ${input.documentNumber}`,
    message:
      `${typeLabel} ${input.documentNumber} has been prepared by Abdullah Properties.` +
      `${verification}\n\nNo PDF is attached automatically. Please attach the saved PDF yourself when needed.`,
  };
}
