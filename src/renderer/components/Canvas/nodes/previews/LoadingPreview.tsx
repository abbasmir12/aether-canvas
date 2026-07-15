export default function LoadingPreview() {
  return (
    <div aria-label="Analyzing file" className="space-y-2.5 px-3 pb-3 pt-1">
      <div className="h-3 w-[82%] animate-pulse rounded-full bg-[#E8E8EB]" />
      <div className="h-3 w-[62%] animate-pulse rounded-full bg-[#EFEFF1] [animation-delay:120ms]" />
      <div className="h-10 w-full animate-pulse rounded-[7px] bg-[#F1F1F3] [animation-delay:240ms]" />
    </div>
  );
}
