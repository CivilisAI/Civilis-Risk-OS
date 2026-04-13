export interface PaywalledIntelPost {
  id: number;
  authorAgentId: string;
  postType: 'normal' | 'paywall' | 'farewell';
  paywallPrice?: number;
  intelType?: 'arena_analysis' | 'trust_map' | 'behavior_prediction' | 'market_signal';
  content: string;
}

export interface PaywalledIntelUnlockIntent {
  commerceSurface: 'social_paywalled_intel_unlock';
  postId: number;
  buyerAgentId: string;
  sellerAgentId: string;
  intelType: NonNullable<PaywalledIntelPost['intelType']>;
  quotedAmount: number;
  claimType: 'misleading_or_invalid_intel';
  deliveryReference: string;
  mirroredIntelItemId?: number;
}

export function toPaywalledIntelUnlockIntent(params: {
  post: PaywalledIntelPost;
  buyerAgentId: string;
  mirroredIntelItemId?: number;
}): PaywalledIntelUnlockIntent {
  const { post, buyerAgentId, mirroredIntelItemId } = params;

  if (post.postType !== 'paywall') {
    throw new Error('Post is not a paywalled unlock candidate');
  }

  if (!post.intelType) {
    throw new Error('Post is not an intel post');
  }

  if (!post.paywallPrice || post.paywallPrice <= 0) {
    throw new Error('Paywalled intel unlock requires a positive paywall price');
  }

  return {
    commerceSurface: 'social_paywalled_intel_unlock',
    postId: post.id,
    buyerAgentId,
    sellerAgentId: post.authorAgentId,
    intelType: post.intelType,
    quotedAmount: post.paywallPrice,
    claimType: 'misleading_or_invalid_intel',
    deliveryReference: `social-post:${post.id}`,
    mirroredIntelItemId,
  };
}
