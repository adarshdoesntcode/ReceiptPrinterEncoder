import CodepageEncoder from 'codepage-encoder';

class LanguageStarPrnt {

    /**
     * Initialize the printer
     * @returns {Array}         Array of bytes to send to the printer
     */
    initialize() {        
        return [
            /* Initialize printer */
            0x1b, 0x40, 0x18
        ];
    }

    /**
     * Change the font
     * @param {string} type     Font type ('A', 'B' or 'C')
     * @returns {Array}         Array of bytes to send to the printer
     */
    font(type) {
        let value = 0x00;

        if (type === 'B') {
            value = 0x01;
        }

        if (type === 'C') {
            value = 0x02;
        }

        return [
            0x1b, 0x1e, 0x46, value
        ];
    }

    /**
     * Change the alignment
     * @param {string} value    Alignment value ('left', 'center', 'right')
     * @returns {Array}         Array of bytes to send to the printer
     */
    align(value) {
        let align = 0x00;

        if (value === 'center') {
            align = 0x01;
        } else if (value === 'right') {
            align = 0x02;
        }

        return [
            0x1b, 0x1d, 0x61, align
        ];
    }

    /**
     * Generate a barcode
     * @param {string} value        Value to encode
     * @param {string} symbology    Barcode symbology
     * @param {number} height       Height of the barcode
     * @returns {Array}             Array of bytes to send to the printer
     */
    barcode(value, symbology, height) {
        let result = [];

        const symbologies = {
            'upce': 0x00,
            'upca': 0x01,
            'ean8': 0x02,
            'ean13': 0x03,
            'code39': 0x04,
            'itf': 0x05,
            'code128': 0x06,
            'code93': 0x07,
            'nw-7': 0x08,
            'gs1-128': 0x09,
            'gs1-databar-omni': 0x0a,
            'gs1-databar-truncated': 0x0b,
            'gs1-databar-limited': 0x0c,
            'gs1-databar-expanded': 0x0d,      
        };
      
        if (typeof symbologies[symbology] === 'undefined') {
            throw new Error('Symbology not supported by printer');
        }


        const bytes = CodepageEncoder.encode(value, 'ascii');
      
        result.push(
            0x1b, 0x62,
            symbologies[symbology], 0x01, 0x03, height,
            ...bytes, 0x1e
        );
    
        return result;
    }

    /**
     * Generate a QR code
     * @param {string} value        Value to encode
     * @param {number} model        QR Code model (1 or 2)
     * @param {number} size         QR Code size (1 to 8)
     * @param {string} errorlevel   Error correction level ('l', 'm', 'q', 'h')
     * @returns {Array}             Array of bytes to send to the printer
     */
    qrcode(value, model, size, errorlevel) {
        let result = [];

        /* Model */

        const models = {
            1: 0x01,
            2: 0x02,
        };
  
        if (typeof model === 'undefined') {
            model = 2;
        }
  
        if (model in models) {
            result.push(
                0x1b, 0x1d, 0x79, 0x53, 0x30, models[model],
            );
        } else {
            throw new Error('Model must be 1 or 2');
        }
  
        /* Size */
  
        if (typeof size === 'undefined') {
            size = 6;
        }
  
        if (typeof size !== 'number') {
            throw new Error('Size must be a number');
        }
  
        if (size < 1 || size > 8) {
            throw new Error('Size must be between 1 and 8');
        }
  
        result.push(
            0x1b, 0x1d, 0x79, 0x53, 0x32, size,
        );
  
        /* Error level */
  
        const errorlevels = {
            'l': 0x00,
            'm': 0x01,
            'q': 0x02,
            'h': 0x03,
        };
  
        if (typeof errorlevel === 'undefined') {
            errorlevel = 'm';
        }
  
        if (errorlevel in errorlevels) {
            result.push(
                0x1b, 0x1d, 0x79, 0x53, 0x31, errorlevels[errorlevel]
            );
        } else {
            throw new Error('Error level must be l, m, q or h');
        }
  
        /* Data */
  
        const bytes = CodepageEncoder.encode(value, 'iso8859-1');
        const length = bytes.length;
  
        result.push(
            0x1b, 0x1d, 0x79, 0x44, 0x31, 0x00, 
            length & 0xff, (length >> 8) & 0xff, 
            ...bytes
        );
  
        /* Print QR code */
  
        result.push(
            0x1b, 0x1d, 0x79, 0x50
        );
        
        return result;
    }

    /**
     * Encode an image
     * @param {ImageData} image     ImageData object
     * @param {number} width        Width of the image
     * @param {number} height       Height of the image
     * @param {string} mode         Image encoding mode (value is ignored)
     * @returns {Array}             Array of bytes to send to the printer
     */
    image(image, width, height, mode) {
        let result = [];

        const getPixel = (x, y) => typeof image.data[((width * y) + x) * 4] === 'undefined' || 
                                   image.data[((width * y) + x) * 4] > 0 ? 0 : 1;

        result.push(
            0x1b, 0x30
        );
      
        for (let s = 0; s < height / 24; s++) {
            const y = s * 24;
            const bytes = new Uint8Array(width * 3);
        
            for (let x = 0; x < width; x++) {
                const i = x * 3;
        
                bytes[i] =
                    getPixel(x, y + 0) << 7 |
                    getPixel(x, y + 1) << 6 |
                    getPixel(x, y + 2) << 5 |
                    getPixel(x, y + 3) << 4 |
                    getPixel(x, y + 4) << 3 |
                    getPixel(x, y + 5) << 2 |
                    getPixel(x, y + 6) << 1 |
                    getPixel(x, y + 7);
        
                bytes[i + 1] =
                    getPixel(x, y + 8) << 7 |
                    getPixel(x, y + 9) << 6 |
                    getPixel(x, y + 10) << 5 |
                    getPixel(x, y + 11) << 4 |
                    getPixel(x, y + 12) << 3 |
                    getPixel(x, y + 13) << 2 |
                    getPixel(x, y + 14) << 1 |
                    getPixel(x, y + 15);
        
                bytes[i + 2] =
                    getPixel(x, y + 16) << 7 |
                    getPixel(x, y + 17) << 6 |
                    getPixel(x, y + 18) << 5 |
                    getPixel(x, y + 19) << 4 |
                    getPixel(x, y + 20) << 3 |
                    getPixel(x, y + 21) << 2 |
                    getPixel(x, y + 22) << 1 |
                    getPixel(x, y + 23);
            }
      
            result.push(
                0x1b, 0x58,
                width & 0xff, (width >> 8) & 0xff,
                ...bytes,
                0x0a, 0x0d
            );
        }
      
        result.push(
            0x1b, 0x7a, 0x01
        );

        return result;
    }

    /**
     * Cut the paper
     * @param {string} value    Cut type ('full' or 'partial')
     * @returns {Array}         Array of bytes to send to the printer
     */
    cut(value) {
        let data = 0x00;

        if (value == 'partial') {
          data = 0x01;
        }
        
        return [
            0x1b, 0x64, data,
        ];
    }

    /**
     * Send a pulse to the cash drawer
     * @param {number} device   Device number
     * @param {number} on       Pulse ON time
     * @param {number} off      Pulse OFF time
     * @returns {Array}         Array of bytes to send to the printer
     */
    pulse(device, on, off) {
        if (typeof device === 'undefined') {
            device = 0;
        }
    
        if (typeof on === 'undefined') {
            on = 200;
        }
    
        if (typeof off === 'undefined') {
            off = 200;
        }
    
        on = Math.min(127, Math.round(on / 10));
        off = Math.min(127, Math.round(off / 10));        
    
        return [
            0x1b, 0x07, on & 0xff, off & 0xff,
            device ? 0x1a : 0x07
        ];
    }

    /**
     * Enable or disable bold text
     * @param {boolean} value   Enable or disable bold text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    bold(value) {
        let data = 0x46;

        if (value) {
            data = 0x45;
        }

        return [
            0x1b, data
        ];
    }

    /**
     * Enable or disable underline text
     * @param {boolean} value   Enable or disable underline text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    underline(value) {
        let data = 0x00;

        if (value) {
            data = 0x01;
        }

        return [
            0x1b, 0x2d, data
        ];
    }

    /**
     * Enable or disable italic text
     * @param {boolean} value   Enable or disable italic text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    italic(value) {
        return [];
    }

    /**
     * Enable or disable inverted text
     * @param {boolean} value   Enable or disable inverted text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    invert(value) {
        let data = 0x35;

        if (value) {
            data = 0x34;
        }

        return [
            0x1b, data
        ];
    }

    /**
     * Change text size
     * @param {number} width    Width of the text (1-8)
     * @param {number} height   Height of the text (1-8)
     * @returns {Array}         Array of bytes to send to the printer
     */
    size(width, height) {
        return [
            0x1b, 0x69, height - 1, width - 1
        ];
    }

    /**
     * Change the codepage
     * @param {number} value    Codepage value
     * @returns {Array}         Array of bytes to send to the printer
     */
    codepage(value) {
        return [
            0x1b, 0x1d, 0x74, value
        ];
    }

    /**
     * Flush the printers line buffer
     * @returns {Array}         Array of bytes to send to the printer
     */
    flush() {
        return [
            0x1b, 0x1d, 0x50, 0x30, 0x1b, 0x1d, 0x50, 0x31
        ]
    }
}

export default LanguageStarPrnt;