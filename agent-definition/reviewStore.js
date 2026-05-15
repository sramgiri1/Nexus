export function createReviewStore(reviews = []) {
  return {
    storeVersion: "1.0",
    mutationAllowed: false,
    reviews,
  };
}

export function addReview(store = createReviewStore(), review = {}) {
  return {
    ...store,
    mutationAllowed: false,
    reviews: [...(store.reviews || []).filter((item) => item.reviewId !== review.reviewId), review],
  };
}

export function listReviews(store = createReviewStore(), proposalId) {
  return (store.reviews || []).filter((review) => !proposalId || review.proposalId === proposalId);
}
