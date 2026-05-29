import { useStore } from "@/store/useStore";

export const usePaginationInfo = (totalCount: number) => {
  const { page: currentPage, size: pageSize } = useStore(
    (state) => state.paginacion,
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const offset = (currentPage - 1) * pageSize;

  return {
    currentPage,
    totalPages,
    pageSize,
    offset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};
