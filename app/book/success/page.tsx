export default function BookSuccessPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">💅</div>
      <h1 className="font-playfair text-3xl font-black text-white tracking-widest uppercase mb-2">
        You&apos;re Booked!
      </h1>
      <p className="font-dancing text-xl text-[var(--color-pink)] text-glow-pink mb-6">
        prettiedbymel
      </p>
      <p className="text-zinc-300 text-sm max-w-xs leading-relaxed mb-4">
        Your deposit was received and your appointment is confirmed. See you soon! ✨
      </p>
      <p className="text-zinc-500 text-xs mb-8">
        Questions? DM <span className="text-[var(--color-pink)]">@prettiedbymel</span> on Instagram.
      </p>
      <a
        href="/book"
        className="text-zinc-600 text-xs underline underline-offset-4 hover:text-zinc-400 transition-colors"
      >
        Book another appointment
      </a>
      <p className="text-zinc-700 text-xs mt-8 tracking-widest uppercase">Suffern, NY · Home Based</p>
    </div>
  );
}
