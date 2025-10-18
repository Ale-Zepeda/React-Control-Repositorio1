function ok(res, data, status = 200) {
  return res.status(status).json(data)
}
function fail(res, error, status = 500) {
  return res.status(status).json({ error })
}
module.exports = { ok, fail }
