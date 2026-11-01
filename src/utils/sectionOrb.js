// الدائرة التي تمثل القسم: صورة التاجر إن ملّها، وإلا صورة صنف ممثل من جوه.
// ما بنخترعش صورة لقسم بلا صورة، وما بنعرضش صورة صنف على أنها صورة القسم حين تكون غير متاحة.
function withPhotos(items) {
  return items.filter((product) => product.image)
}

// الصنف الممثل: الأكثر طلبًا إن كان مصوَّرًا، وإلا أول صنف له صورة — والصورة وحدها هي الشرط
export function coverProductOf(items) {
  const candidates = withPhotos(items)
  if (!candidates.length) return null
  return candidates.find((product) => (product.tags ?? []).includes('best-seller')) ?? candidates[0]
}

// alt فارغ حين الصورة من صنف: اسم القسم مكتوب تحت الدائرة، فتكراره في alt يقرأه قارئ الشاشة مرتين
export function orbSourceOf(category, items) {
  if (category.image) return { src: category.image, alt: `نماذج من منتجات ${category.name}` }
  const cover = coverProductOf(items)
  return cover ? { src: cover.image, alt: '' } : { src: null, alt: '' }
}
