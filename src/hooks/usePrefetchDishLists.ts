// import { useQueryClient } from '@tanstack/react-query';
// import { queryKeys } from '../lib/queryKeys';
// import { getDishLists } from '../services/api';

// export const usePrefetchDishLists = () => {
//   const queryClient = useQueryClient();

//   const prefetchDishLists = async () => {
//     try {
//       // Prefetch the most commonly accessed tabs
//       await Promise.all([
//         queryClient.prefetchQuery({
//           queryKey: queryKeys.dishLists.list('all'),
//           queryFn: () => getDishLists('all'),
//           staleTime: 5 * 60 * 1000, // 5 minutes
//         }),
//         queryClient.prefetchQuery({
//           queryKey: queryKeys.dishLists.list('my'),
//           queryFn: () => getDishLists('my'),
//           staleTime: 5 * 60 * 1000,
//         }),
//       ]);
      
//       console.log('DishLists prefetched successfully');
//       return true;
//     } catch (error) {
//       console.warn('DishLists prefetch failed:', error);
//       // Don't throw - prefetch failures should be silent
//       return false;
//     }
//   };

//   return { prefetchDishLists };
// };