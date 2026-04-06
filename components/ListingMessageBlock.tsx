type ListingMessageBlockProps = Readonly<{
  listingMessage: string;
}>;

export default function ListingMessageBlock({
  listingMessage,
}: ListingMessageBlockProps) {
  if (!listingMessage) return null;

  return (
    <p
      className={`form-message ${
        listingMessage.includes("✅") ? "is-success" : "is-error"
      }`}
    >
      {listingMessage}
    </p>
  );
}