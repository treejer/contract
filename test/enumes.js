const TimeEnumes = {
  hours: "hours",
  days: "days",
  minutes: "minutes",
  seconds: "seconds",
  weeks: "weeks",
  years: "years",
};

const erc20ErrorMsg = {
  ZERO_ADDRESS: "ERC20: transfer from the zero address",
  INSUFFICIENT_BALANCE: "ERC20: transfer amount exceeds balance",
  APPROVAL_ISSUE: "ERC20: transfer amount exceeds allowance",
};
const CommonErrorMsg = {
  PAUSE: "Pausable: paused",
  CHECK_ADMIN: "Caller is not admin",
  CHECK_TREEJER_CONTTRACT: "caller is not treejer contract",
  CHECK_AUCTION: "Caller is not Auction",
  CHECK_ADMIN_OR_TREEJER_CONTRACT: "not Admin or Treejer Contract",
  CHECK_TREE_FACTORY: "Caller is not TreeFactory",
  CHECK_PLANTER: "Caller is not a planter",
  CHECK_REGULAR_SELL: "Caller is not RegularSell",
  CHECk_FUNDS_OR_COMMUNITY_GIFTS: "not funds or community gifts",
  CHECK_AUCTION_OR_COMMUNITY_GIFTS_OR_INCREMENTAL_SELL:
    "not auction or community gifts or incrementalSell",
  INVALID_ADDRESS: "invalid address",
  INVALID_APPROVE: "ERC20: transfer amount exceeds allowance.",
  ZERO_ADDRESS: "ERC20: transfer to the zero address.",
};

const TreeAuctionErrorMsg = {
  MANUAL_WITHDRAW_USER_BALANCE: "User balance is not enough",
  TREE_STATUS: "not available for auction",
  BID_VALUE: "invalid amount",
  INSUFFICIENT_AMOUNT: "insufficient balance",
  BID_BEFORE_START: "auction not started",
  BID_AFTER_END: "auction already ended",
  END_AUCTION_BEFORE_END_TIME: "Auction not yet ended",
  END_AUCTION_WHEN_IT_HAS_BEEN_ENDED: "endAuction has already been called",
  AUCTION_IS_UNAVAILABLE: "Auction is unavailable",
};

const TreeFactoryErrorMsg = {
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
  INVALID_GB: "invalid gb",
  CANT_ASSIGN_TREE_TO_PLANTER: "can't assign tree to planter",
  INVALID_TREE: "invalid tree",
  UPDATE_TIME_NOT_REACH: "Update time not reach",
  UPDATE_TREE_FAIL_INVALID_UPDATE_TREE_STATUS: "update tree status is pending",
  ONLY_PLANTER_OF_TREE_CAN_SEND_UPDATE: "Only Planter of tree can send update",
  TREE_NOT_PLANTED: "Tree not planted",
  ADMIN_ABBASSADOR_PLANTER: "Admin or ambassador or planter can accept updates",
  INVALID_ACCESS_PLANTER_OF_TREE: "Planter of tree can't verify update",
  UPDATE_STATUS_MUST_BE_PENDING: "update status must be pending",
  CALLER_IS_NOT_AUCTION: "Caller is not Auction",
  TREE_MUST_BE_PLANTED: "tree must be planted",
  REGULAR_TREE_NOT_EXIST: "regularTree not exist",
};
const TreasuryManagerErrorMsg = {
  INSUFFICIENT_AMOUNT: "insufficient amount",
  PLANTER_FUND_NOT_EXIST: "planter fund not exist",
  SUM_INVALID: "sum must be 10000",
  INVALID_FUND_MODEL: "invalid fund model",
  ONLY_AUCTION_OR_INCREAMENTAL: "not IncrementalSell or Auction",
  INVALID_ASSIGN_MODEL: "equivalant fund Model not exists",
  DISTRIBUTION_MODEL_NOT_FOUND: "Distribution model not found",
};

const DaiFundsErrorMsg = {
  INSUFFICIENT_AMOUNT: "insufficient amount",
};
const FinancialModelErrorMsg = {
  SUM_INVALID: "sum must be 10000",
  DISTRIBUTION_MODEL_NOT_FOUND: "Distribution model not found",
  INVALID_FUND_MODEL: "invalid fund model",
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
  TREE_WITH_NO_ATTRIBUTES: "no need to tree attributes",
  ATTRIBUTE_TAKEN: "the tree attributes are taken",
  ATTRIBUTE_NOT_RESERVED: "the tree attributes not reserved",
};

const CommunityGiftErrorMsg = {
  CLAIMED_BEFORE: "Claimed before",
  MAX_GIFT_AMOUNT_REACHED: "max giftCount reached",
  TREES_ARE_NOT_AVAILABLE: "trees are not available",
  EXPIREDATE_REACHED: "CommunityGift ended",
  USER_NOT_EXIST: "User not exist",
  EXPIREDATE_NOT_REACHED: "CommunityGift Time not yet ended",
  SYMBOL_NOT_RESERVED: "Symbol not reserved",
  CANT_UPDATE_EXPIRE_DATE: "can not update expire date",
  TREE_IS_NOT_FOR_GIFT: "tree is not for community gift",
};

module.exports = {
  TimeEnumes,
  CommonErrorMsg,
  TreeAuctionErrorMsg,
  TreeFactoryErrorMsg,
  TreasuryManagerErrorMsg,
  PlanterErrorMsg,
  RegularSellErrors,
  IncrementalSellErrorMsg,
  TreeAttributeErrorMsg,
  DaiFundsErrorMsg,
  FinancialModelErrorMsg,
  CommunityGiftErrorMsg,
  erc20ErrorMsg,
};
