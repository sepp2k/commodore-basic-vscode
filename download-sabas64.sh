version=`cat sabas64-version`
curl -L https://github.com/sepp2k/sabas64/releases/download/$version/sabas64.tar | tar -x --transform 's!^sabas64-[^/]*!sabas64!'