type SectionHeaderProps = {
  eyebrow: string
  title: string
  subtitle?: string
  eyebrowClassName?: string
  centered?: boolean
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  eyebrowClassName = 'text-terracotta',
  centered = false,
}: SectionHeaderProps) {
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : ''}>
      <p
        className={`text-sm font-bold uppercase tracking-[0.12em] ${eyebrowClassName}`}
      >
        {eyebrow}
      </p>

      <h2 className="mt-2 font-display text-3xl font-black leading-tight text-espresso sm:text-4xl">
        {title}
      </h2>

      {subtitle && (
        <p
          className={`mt-3 leading-7 text-cacao/80 sm:text-lg ${
            centered ? 'mx-auto max-w-2xl' : 'max-w-2xl'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
