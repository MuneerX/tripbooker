
export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="bg-muted/40">
        {children}
    </section>
  )
}
