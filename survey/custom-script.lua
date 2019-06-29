addonsurlvalue = urlvalue("addons")
if addonsurlvalue == false then
  addons = {}
else
  addons = json_decode(addonsurlvalue)
end
-- print(json_encode(addons))

-- Page 1
page1NeedIds = {145,148,151,154,157,160}
page1HiddenValueGuidIds = {143,146,149,152,155,158}
for key,id in ipairs(page1NeedIds) do
  addon = addons[key-1]
  -- print(key)
  -- print(id)
  -- print(json_encode(addon))
  -- print(page1HiddenValueGuidIds[key])
  if (addon == nil) then
    hidequestion(id, true)
  else
    hidequestion(id, false)
    -- print(addon["name"])
    -- print(addon["icon"])
    -- print(addon["guid"])
    settitle(id, "<img alt=\"\" class=\"extension-icon\" onerror=\"this.onerror = null;this.src = 'https://addons.cdn.mozilla.net/static/img/addon-icons/default-128.png';\" src=\"" .. htmlentities(addon["icon"]) .. "\"><strong><span class=\"extension-name\">" .. htmlentities(addon["name"]) .. "</span></strong><br/><span>What were you trying to achieve with this extension?</span> <strong class=\"sg-required-icon\">*<span class=\"sg-screenreader-only\">This question is required.</span></strong>", "English")
    setvalue(page1HiddenValueGuidIds[key], addon["guid"])
  end
end

-- Page 2
page2ImportanceIds = {68,74,79,84,89,114}
for key,id in ipairs(page2ImportanceIds) do
  addon = addons[key-1]
  page1Id = page1NeedIds[key]
  if (addon == nil) then
    hidequestion(id, true)
  else
    if getvalue(page1Id) == "|n/a|" or getvalue(page1Id) == "I don't know/remember" then
      hidequestion(id, true)
    else
      hidequestion(id, false)
      -- print(getvalue(page1Id))
      -- print(getvalue(page1HiddenValueGuidIds[key]))
      settitle(id, "<span><strong>You wrote \"" .. htmlentities(getvalue(page1Id)) .. "\"</strong></span>", "English")
    end
  end
end
page2SatisfactionIds = {63,71,76,81,86,117}
for key,id in ipairs(page2SatisfactionIds) do
  addon = addons[key-1]
  page1Id = page1NeedIds[key]
  if (addon == nil) then
    hidequestion(id, true)
  else
    if getvalue(page1Id) == "|n/a|" or getvalue(page1Id) == "I don't know/remember" then
      hidequestion(id, true)
    else
      hidequestion(id, false)
      settitle(id, "<span><strong>How satisfied were/are you with regards to \"" .. htmlentities(getvalue(page1Id)) .. "\" before and after installing \"" .. htmlentities(addon["name"]) .. "\"?</strong></span>", "English")
    end
  end
end
