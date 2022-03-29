const TimeEnumes = {
  hours: "hours",
  days: "days",
  minutes: "minutes",
  seconds: "seconds",
  weeks: "weeks",
  years: "years",
};

const SafeMathErrorMsg = {
  OVER_FLOW: "Panic: Arithmetic overflow",
};

const GsnErrorMsg = {
  ADDRESS_NOT_EXISTS: "Target not exists",
};

const erc20ErrorMsg = {
  ZERO_ADDRESS: "ERC20: transfer from the zero address",
  INSUFFICIENT_BALANCE: "ERC20: transfer amount exceeds balance",
  APPROVAL_ISSUE: "ERC20: transfer amount exceeds allowance",
};

const erc721ErrorMsg = {
  MINTED_BEFORE: "token already minted.",
  TRANSFER_TO_ZERO_ADDRESS: "ERC721: transfer to the zero address",
  TRANSFER_FROM_CALLER_APPROVE_PROBLEM:
    "ERC721: transfer caller is not owner nor approved",
  TRANSFER_NON_EXISTENT_TOKEN: "ERC721: operator query for nonexistent token",
  TRANSFER_TOKEN_FROM_NON_OWNER: "ERC721: transfer of token that is not own",
};
const CommonErrorMsg = {
  PAUSE: "Pausable: paused",
  CHECK_ADMIN: "Caller not admin",
  CHECK_TREEJER_CONTTRACT: "Caller not treejer contract",
  CHECK_DATA_MANAGER_OR_TREEJER_CONTRACT: "Caller not dm or tc",
  CHECK_PLANTER: "Caller not planter",
  CHECK_DATA_MANAGER: "Caller not data manager",
  CHECK_SCRIPT_ROLE: "Caller not script",
  CHECK_VERIFIER_ROLE: "Caller not verifier",

  INVALID_ADDRESS: "Invalid address",
  INVALID_APPROVE: "ERC20: transfer amount exceeds allowance.",
  ZERO_ADDRESS: "ERC20: transfer to the zero address.",
  CHECK_IF_PAUSED: "Pausable: not paused",
  CHECK_IF_NOT_PAUSED: "Pausable: paused",
  UNISWAP_OUTPUT_AMOUNT: "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT",
  CHECK_TREEBOX_SCRIPT: "Caller not TreeBox script",
};

const AuctionErrorMsg = {
  INVALID_REFERAL: "Invalid referrer",
  MANUAL_WITHDRAW_USER_BALANCE: "User balance is not enough",
  TREE_STATUS: "Not available",
  BID_VALUE: "Invalid amount",
  INVALID_BIDINTERVAL: "Invalid bidInterval",
  INSUFFICIENT_AMOUNT: "Insufficient balance",
  BID_BEFORE_START: "Auction not started",
  BID_AFTER_END: "Auction ended",
  END_AUCTION_BEFORE_END_TIME: "Auction not ended",
  END_AUCTION_WHEN_IT_HAS_BEEN_ENDED: "endAuction has already been called",
  AUCTION_IS_UNAVAILABLE: "Auction unavailable",
};

const TreeFactoryErrorMsg = {
  PLANT_TREE_ACCESS_NO_PLANTER: "planter in gb can plant tree",
  INVALID_ACCESS_TO_VERIFY: "invalid access to verify",
  VERIFY_PLANT_ACCESS: "invalid access to verify",
  VERIFY_PLANT_BY_PLANTER: "Planter of tree can't accept update",
  INVALID_TREE_STATUS_IN_VERIFY_PLANT: "Invalid tree status",
  INVALID_UPDATE_STATUS_IN_VERIFY_PLANT: "invalid update status",
  DUPLICATE_TREE: "Duplicate tree",
  PLANTING_PERMISSION_DENIED: "Permission denied",
  INVALID_TREE_STATUS_FOR_PLANT: "Invalid tree status",
  INVALID_TREE_TO_ASSIGN: "Invalid tree",
  INVALID_GB: "invalid gb",
  CANT_ASSIGN_TREE_TO_PLANTER: "Not allowed planter",
  INVALID_TREE: "invalid tree",
  UPDATE_TIME_NOT_REACH: "Early update",
  UPDATE_TREE_FAIL_INVALID_UPDATE_TREE_STATUS: "Pending update",
  ONLY_PLANTER_OF_TREE_CAN_SEND_UPDATE: "Not owned tree",
  TREE_NOT_PLANTED: "Tree not planted",
  ADMIN_ABBASSADOR_PLANTER: "Admin or ambassador or planter can accept updates",
  INVALID_ACCESS_PLANTER_OF_TREE: "Planter of tree can't verify update",
  UPDATE_STATUS_MUST_BE_PENDING: "Not pending update",
  CALLER_IS_NOT_AUCTION: "Caller is not Auction",
  TREE_MUST_BE_PLANTED: "Tree not planted",
  REGULAR_TREE_NOT_EXIST: "Regular Tree not exists",
  TREE_HAS_PENDING_UPDATE: "Pending update exists",
  INVALID_SET_LAST_REGULAR_TREE_INPUT: "Invalid lastRegualarTreeId",
};
const TreasuryManagerErrorMsg = {
  INSUFFICIENT_AMOUNT: "Invalid amount",
  PLANTER_FUND_NOT_EXIST: "Projected earning zero",
  SUM_INVALID: "Invalid sum",
  INVALID_FUND_MODEL: "Allocation not exists",
  INVALID_ASSIGN_MODEL: "Allocation not exists",
  ALLOCATION_MODEL_NOT_FOUND: "Allocation not exists",
};

const DaiFundErrorMsg = {
  INSUFFICIENT_AMOUNT: "Invalid amount",
  LIQUDITY_NOT_ENOUGH: "Insufficient Liquidity",
};
const AllocationErrorMsg = {
  SUM_INVALID: "Invalid sum",
  ALLOCATION_MODEL_NOT_FOUND: "Allocation not exists",
  INVALID_FUND_MODEL: "Allocation not exists",
};

const PlanterErrorMsg = {
  ORGANIZATION_INVALID_ACCESS: "Caller is organization",
  ONLY_PLANTER: "Exist or not planter",
  INVALID_SUPPLYCAP: "Invalid supplyCap",
  PLANTER_NOT_EXIST: "Planter not exist",
  PLANTERTYPE_ALLOWED_VALUE: "Invalid planterType",
  ORGANIZATION_NOT_VALID: "Invalid organization",
  REFFERED_NOT_TRUE: "Invalid invitedBy",
  INVALID_PLANTER_TYPE: "Planter type same",
  PLANTER_NOT_ORGANIZATION: "Planter not organization",
  INVALID_PLANTER: "Not memberOf",
  INVALID_PLANTER_STATUS: "Invalid planter status",
  INVALID_PAYMENT_PORTION: "Invalid share",
  ACCEPT_PLANTER_ACCESS_ERROR: "Request not exists",
};

const RegularSaleErrors = {
  INVALID_TREE: "Invalid treeId",
  INSUFFICIENT_AMOUNT: "Insufficient balance",
  INVALID_COUNT: "Invalid count",
  INVALID_SET_LAST_REGULAR_TREE_SELL_INPUT: "Invalid lastFundedTreeId",
  INVALID_GIFT_OWNER: "Claimable zero",
  MAX_SUPPLY: "Max supply reached",
  MAX_SUPPLY_MUST_GT_LAST_FUNDED_TREE: "Invalid maxTreeSupply",
  COUNT_MUST_BE_GT_ZERO: "Invalid count",
  INVALID_REFERAL: "Invalid referrer",
};

const IncrementalSaleErrorMsg = {
  TREE_TO_SELL: "assign at least one tree",
  INVALID_TREE_COUNT: "Invalid treeCount",
  INVALID_COUNT: "Invalid count",
  OCCUPIED_TREES: "Invalid startTreeId",
  PRICE_CHANGE_PERIODS: "Invalid increments",
  INCREMENTAL_SALE_EXIST: "Not exists",
  TREE_PROVIDED_BEFORE: "Trees not available",
  INVALID_TREE: "Insufficient tree",
  INVALID_REFERAL: "Invalid referrer",
  // INVALID_TREE: "tree is not in incremental sell",
  LOW_PRICE_PAID: "Insufficient balance",
  FREE_INCREMENTALSALE_FAIL: "Cant remove",
  CANT_CREATE_NEW_INCREMENTALSALE: "Cant create",
};

const AttributeErrorMsg = {
  DUPLICATE_TREE_ATTRIBUTES: "Duplicate attribute",
  ATTRIBUTE_TAKEN: "Duplicate symbol",
  ATTRIBUTE_NOT_RESERVED: "Attribute not exists",
  SYMBOL_IS_TAKEN: "Duplicate symbol",
  EMPTY_TOKEN_LIST: "Invalid tokens",
  UNISWAP_INSUFFICIENT_LIQUIDITY: "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
  INVALID_SYMBOL: "Invalid symbol",
};

const HonoraryTreeErrorMsg = {
  CLAIMED_BEFORE: "Claimed before",
  MAX_GIFT_AMOUNT_REACHED: "max giftCount reached",
  TREES_ARE_NOT_AVAILABLE: "Tree not available",
  USER_NOT_EXIST: "User not exist",
  SYMBOL_NOT_RESERVED: "Symbol not reserved",
  CANT_UPDATE_EXPIRE_DATE: "can not update expire date",
  TREE_IS_NOT_FOR_GIFT: "tree is not for community gift",
  INVALID_RANGE: "Invalid range",
  RECIPIENT_NOT_EXIST: "Recipient not exist",
  CANT_SET_RANGE: "Cant set range",
  CANT_CLAIM: "Cant claim",
  SYMBOL_NOT_EXIST: "Insufficient symbol",
};

const WethFundErrorMsg = {
  LIQUDITY_NOT_ENOUGH: "Insufficient Liquidity",
  TOTALDAI_INVALID: "Invalid totalDaiDebtToPlanterContract ",
};
const TreeBoxErrorMsg = {
  NOT_REGULAR: "Not Regular Tree",
  RECIEVER_INCORRECT: "recipient not exists",
  CANT_TRANSFER_TO_THIS_ADDRESS: "recipient is msg.sender",
  PUBLIC_KEY_EXISTS: "recipient exists",
  INVALID_RECIPIENTS: "invalid recipients",
};

module.exports = {
  TimeEnumes,
  CommonErrorMsg,
  AuctionErrorMsg,
  TreeFactoryErrorMsg,
  TreasuryManagerErrorMsg,
  PlanterErrorMsg,
  RegularSaleErrors,
  IncrementalSaleErrorMsg,
  AttributeErrorMsg,
  DaiFundErrorMsg,
  AllocationErrorMsg,
  HonoraryTreeErrorMsg,
  erc20ErrorMsg,
  GsnErrorMsg,
  erc721ErrorMsg,
  WethFundErrorMsg,
  SafeMathErrorMsg,
  TreeBoxErrorMsg,
};
