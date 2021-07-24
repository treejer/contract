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
  CHECK_AUCTION: "Caller is not Auction",
  CHECK_GENESIS_TREE: "Caller is not GenesisTree",
  CHECK_PLANTER: "Caller is not a planter",
  CHECK_REGULAR_SELL: "Caller is not RegularSell",
  INVALID_ADDRESS: "invalid address",
};

const TreeAuctionErrorMsg = {
  MANUAL_WITHDRAW_USER_BALANCE: "User balance is not enough",
  TREE_STATUS: "not available for auction",
  BID_VALUE: "invalid amount",
  BID_BEFORE_START: "auction not started",
  BID_AFTER_END: "auction already ended",
  END_AUCTION_BEFORE_END_TIME: "Auction not yet ended",
  END_AUCTION_WHEN_IT_HAS_BEEN_ENDED: "endAuction has already been called",
};

const GenesisTreeErrorMsg = {
  PLANT_TREE_ACCESS_NO_PLANTER: "planter in gb can plant tree",
  INVALID_ACCESS_TO_VERIFY: "invalid access to verify",
  VERIFY_PLANT_ACCESS: "invalid access to verify",
  VERIFY_PLANT_BY_PLANTER: "Planter of tree can't accept update",
  INVALID_TREE_STATUS_IN_VERIFY_PLANT: "invalid tree status",
  INVALID_UPDATE_STATUS_IN_VERIFY_PLANT: "invalid update status",
  DUPLICATE_TREE: "duplicate tree",
  PLANTING_PERMISSION_DENIED: "planting permission denied",
  INVALID_TREE_STATUS_FOR_PLANT: "invalid tree status for plant",
  INVALID_TREE_TO_ASSIGN: "invalid tree to assign",
  ZERO_ADDRESS_PLANTER: "invalid planter address",
  INVALID_GB: "invalid gb",
  INVALID_PLANTER: "planter not exist",
  INVALID_TREE: "invalid tree",
  UPDATE_TIME_NOT_REACH: "Update time not reach",
  UPDATE_TREE_FAIL_INVALID_GENESIS_TREE_STATUS:
    "update genesis tree status is pending",
  ONLY_PLANTER_OF_TREE_CAN_SEND_UPDATE: "Only Planter of tree can send update",
  TREE_NOT_PLANTED: "Tree not planted",
  ADMIN_ABBASSADOR_PLANTER: "Admin or ambassador or planter can accept updates",
  INVALID_ACCESS_PLANTER_OF_TREE: "Planter of tree can't verify update",
  UPDATE_STATUS_MUST_BE_PENDING: "update status must be pending",
  CALLER_IS_NOT_AUCTION: "Caller is not Auction",
  TREE_MUST_BE_PLANTED: "tree must be planted",
  REGULAR_TREE_NOT_EXIST: "regularTree not exist",
};
const TreesuryManagerErrorMsg = {
  INSUFFICIENT_AMOUNT: "insufficient amount",
  PLANTER_FUND_NOT_EXIST: "planter fund not exist",
  SUM_INVALID: "sum must be 10000",
  INVALID_FUND_MODEL: "invalid fund model",
  ONLY_AUCTION_OR_INCREAMENTAL_OR_REGULAR_SELL:
    "not IncrementalSell or Auction or RegularSell",
  INVALID_ASSIGN_MODEL: "equivalant fund Model not exists",
  DISTRIBUTION_MODEL_NOT_FOUND: "Distribution model not found",
};
const PlanterErrorMsg = {
  ORGANIZATION_INVALID_ACCESS: "Caller is organizationPlanter",
  ONLY_PLANTER: "User exist or not planter",
  INVALID_CAPACITY: "invalid capacity",
  PLANTER_NOT_EXIST: "planter does not exist",
  PLANTERTYPE_ALLOWED_VALUE: "planterType not allowed values",
  ORGANIZATION_NOT_VALID: "organization address not valid",
  REFFERED_NOT_TRUE: "refferedBy not true",
  INVALID_PLANTER_TYPE: "invalid planterType in change",
  PLANTER_NOT_ORGANIZATION: "Planter is not organization",
  INVALID_PLANTER: "invalid input planter",
  INVALID_PLANTER_STATUS: "invalid planter status",
  INVALID_PAYMENT_PORTION: "invalid payment portion",
  ACCEPT_PLANTER_ACCESS_ERROR: "Planter not request or not pending",
};

const RegularSellErrors = {
  INVALID_TREE: "invalid tree",
  INVALID_AMOUNT: "invalid amount",
  INVALID_COUNT: "invalid count",
};

const IncrementalSellErrorMsg = {
  TREE_TO_SELL: "assign at least one tree",
  OCCUPIED_TREES: "trees are under Auction",
  PRICE_CHANGE_PERIODS: "incremental period should be positive",
  TREE_PROVIDED_BEFORE: "trees are not available for sell",
  INVALID_TREE: "tree is not in incremental sell",
  LOW_PRICE_PAID: "low price paid",
};
const TreeAttributeErrorMsg = {
  DUPLICATE_TREE_ATTRIBUTES: "the tree attributes are taken",
  TREE_HAS_ATTRIBUTES: "tree attributes are set before",
};
module.exports = {
  TimeEnumes,
  CommonErrorMsg,
  TreeAuctionErrorMsg,
  GenesisTreeErrorMsg,
  TreeAuctionErrorMsg,
  TreesuryManagerErrorMsg,
  PlanterErrorMsg,
  RegularSellErrors,
  IncrementalSellErrorMsg,
  TreeAttributeErrorMsg,
};
