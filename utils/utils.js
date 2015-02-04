var utils = {
	/*
	* Returns a 20-byte SHA1 hash of the input value as a buffer
	*/
	sha1: function (inputValue) {
		return crypto.createHash('sha1').update(inputValue).digest();
	},

	/*
	* Returns a 20-byte SHA1 hash of the input value as a hex string
	*/
	sha1hex: function (inputValue) {
		return crypto.createHash('sha1').update(inputValue).digest('hex');
	},
	
	/*
	* Returns a urlencoded 20-byte SHA1 hash of the given value.
	*/
	computeURLEncodedHash = function (data) {
		var hash = sha1hex(data);
		var info_hash = "";

		for (var i = 0; i < hash.length; i += 2) {
			var charCode = parseInt(hash.substr(i, 2), 16); // character code in unicode 
															// 16 -> to read from hex to int
			
			if (charCode <= 127) {
				var encodedChar = encodeURIComponent(String.fromCharCode(charCode));

				if (encodedChar.charAt(0) == "%") {
					info_hash += encodedChar.toLowerCase();
				} else {
					info_hash += encodedChar;
				}
			} else {
				info_hash += "%" + hash.substr(i, 2); // stays in hex
			}
		}
		
		return info_hash;
	}
};

module.exports = utils;