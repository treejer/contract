const TimeEnumes = {
  hours: "hours",
  days: "days",
  minutes: "minutes",
  seconds: "seconds",
  weeks: "weeks",
  years: "years",
};

const CommonErrorMsg = {
  PAUSE: "Pausable: paused",
  CHECK_ADMIN: "Caller is not admin",
};

const TreeAuctionErrorMsg = {
  MANUAL_WITHDRAW_USER_BALANCE: "User balance is not enough",
  TREE_STATUS: "the tree is on other provide",
  BID_VALUE: "invalid amount",
  BID_BEFORE_START: "auction not started",
  BID_AFTER_END: "auction already ended",
  END_AUCTION_BEFORE_END_TIME: "Auction not yet ended",
  END_AUCTION_WHEN_IT_HAS_BEEN_ENDED: "endAuction has already been called",
};
const GenesisTreeErrorMsg = {
  DUPLICATE_TREE: "duplicate tree",
  INVALID_IPFS: "invalid ipfs hash",
  TREE_IS_PLANTED_BEFORE: "the tree is planted",
  INVALID_GB: "invalid gb",
  INVALID_PLANTER: "invalid planter data",
  INVALID_TREE: "invalid tree",
};

module.exports = {
  TimeEnumes,
  CommonErrorMsg,
  TreeAuctionErrorMsg,
  GenesisTreeErrorMsg,
};
