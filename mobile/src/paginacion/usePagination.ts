import { useCallback } from 'react';

export const usePagination = (pageSize: number) => {
  const calculateTotalPages = useCallback(
    (totalCount: number) => {
      return Math.ceil(totalCount / pageSize);
    },
    [pageSize]
  );

  const calculateOffset = useCallback(
    (currentPage: number) => {
      return (currentPage - 1) * pageSize;
    },
    [pageSize]
  );

  const getPageInfo = useCallback(
    (currentPage: number, totalCount: number) => {
      const totalPages = calculateTotalPages(totalCount);
      return {
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        offset: calculateOffset(currentPage),
      };
    },
    [calculateTotalPages, calculateOffset]
  );

  return {
    calculateTotalPages,
    calculateOffset,
    getPageInfo,
  };
};
