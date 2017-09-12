/**
 * Paginate a mongoose query
 * @param query {Object}
 * @param itemCount {Number}
 * @param page {Number}
 * @param callback {Function}
 * @returns {*}
 */
module.exports = function (query, itemCount, page, callback) {
  if (itemCount < 1) return process.nextTick(() => callback(new Error('Items per page must be above 0')));
  if (page < 1) page = 1;
  const countQuery = query.model.find().merge(query); // it is necessary to copy the query and execute 2 of them
  countQuery.count((err, count) => {
    if (err) return callback(err);
    const pages = Math.ceil(count / itemCount) || 1; // round pages up and if there are no items set page to 1
    if (pages < page) page = pages; // if requested page is higher than maximum, show last
    const paginateQuery = query.skip((page - 1) * itemCount).limit(itemCount);
    paginateQuery.exec((err, result) => {
      if (err) return callback(err);
      callback(null, {page: page, pages: pages, items: result});
    });
  });
};
