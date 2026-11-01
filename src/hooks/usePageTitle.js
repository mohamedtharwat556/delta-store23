import { useEffect } from 'react'
import { company } from '../data/company.js'

// عنوان التبويب لكل مسار: «القسم | الدلتا» — الفصل بالعمودي لأن أسماء الأصناف تحتوي شرطة طويلة أصلًا
export function usePageTitle(section) {
  useEffect(() => {
    document.title = section
      ? `${section} | ${company.nameAr}`
      : `${company.nameAr} | ${company.legalName} — الزرقا، دمياط`
  }, [section])
}
