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
  manualWithdrawUserBalance: "User balance is not enough",
  TREE_STATUS: "the tree is on other provide",
  BID_VALUE: "invalid amount",
  BID_BEFORE_START: "auction not started",
  BID_AFTER_END: "auction already ended",
  END_AUCTION_BEFORE_END_TIME: "Auction not yet ended",
  END_AUCTION_WHEN_IT_HAS_BEEN_ENDED: "endAuction has already been called",
  END_AUCTION_WITH_NO_REFER: "No refer to auction",
};

module.exports = {
  TimeEnumes,
  CommonErrorMsg,
  TreeAuctionErrorMsg,
};
