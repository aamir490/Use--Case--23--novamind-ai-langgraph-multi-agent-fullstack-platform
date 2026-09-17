import api from "../../utils/axios"

export const fetchAdminStats = async () => {
    try {
        const { data } = await api.get("/api/admin/stats")
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}

export const fetchAdminUsers = async (params = {}) => {
    try {
        const { data } = await api.get("/api/admin/users", { params })
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}

export const fetchAdminUserById = async (id) => {
    try {
        const { data } = await api.get(`/api/admin/users/${id}`)
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}

export const updateAdminUser = async (id, body) => {
    try {
        const { data } = await api.patch(`/api/admin/users/${id}`, body)
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}

export const deleteAdminUser = async (id) => {
    try {
        const { data } = await api.delete(`/api/admin/users/${id}`)
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}

export const fetchAdminPayments = async (params = {}) => {
    try {
        const { data } = await api.get("/api/admin/payments", { params })
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}
