let jwt = require('jsonwebtoken')
let userController = require("../controllers/users")

function normalizeRoleName(role) {
    if (!role) return "";
    if (typeof role === "string") return role;
    if (typeof role === "object" && role.name) return role.name;
    return "";
}

function hasRequiredRole(currentRoleName, requiredRole) {
    const normalizedCurrentRole = String(currentRoleName || "").trim().toUpperCase();
    const normalizedRequiredRole = String(requiredRole || "").trim().toUpperCase();

    const legacyRoleMap = {
        "QUAN TRI VIEN": "ADMIN",
        "QUẢN TRỊ VIÊN": "ADMIN",
        "NGUOI DIEU HANH": "MODERATOR",
        "NGƯỜI ĐIỀU HÀNH": "MODERATOR",
        "USER": "USER"
    };

    const mappedCurrentRole = legacyRoleMap[normalizedCurrentRole] || normalizedCurrentRole;
    return mappedCurrentRole === normalizedRequiredRole;
}

module.exports = {
    checkLogin: async function (req, res, next) {
        try {
            let token;
            if (req.cookies.TOKEN_LOGIN) {
                token = req.cookies.TOKEN_LOGIN;
            } else {
                token = req.headers.authorization;
                if (!token || !token.startsWith('Bearer')) {
                    res.status(404).send("ban chua dang nhap")
                }
                token = token.split(" ")[1];
            }
            let result = jwt.verify(token, "secret");
            if (result.exp * 1000 > Date.now()) {
                let user = await userController.FindUserById(result.id);
                if (user) {
                    req.user = user
                    next();
                } else {
                    res.status(404).send("ban chua dang nhap")
                }
            } else {
                res.status(404).send("ban chua dang nhap")
            }
        } catch (error) {
            res.status(404).send("ban chua dang nhap")
        }
    },
    checkRole: function (...requiredRole) {
        return function (req, res, next) {
            let currentRole = normalizeRoleName(req.user.role);
            if (requiredRole.some(role => hasRequiredRole(currentRole, role))) {
                next();
            } else {
                res.status(403).send("ban khong co quyen")
            }
        }
    }
}
