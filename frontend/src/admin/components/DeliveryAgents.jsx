// admin/src/components/DeliveryAgents.jsx
import React, { useState } from 'react';
import AddAgentForm from './AddAgentForm';
import AgentsList from './AgentsList';

const DeliveryAgents = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'

    const handleAgentAdded = () => {
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('list'); // Switch to list after adding
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center mb-2">
                        <i className="fas fa-truck text-4xl text-emerald-600 mr-4"></i>
                        <h1 className="text-4xl font-bold text-gray-900">
                            Delivery Agents Management
                        </h1>
                    </div>
                    <p className="text-gray-600 ml-16">
                        Create and manage delivery agents for order assignments
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-md mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`flex-1 py-4 px-6 text-center font-semibold transition-colors duration-200 ${
                                activeTab === 'list'
                                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                                    : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                            }`}
                        >
                            <i className="fas fa-list mr-2"></i>
                            Agents List
                        </button>
                        <button
                            onClick={() => setActiveTab('add')}
                            className={`flex-1 py-4 px-6 text-center font-semibold transition-colors duration-200 ${
                                activeTab === 'add'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                        >
                            <i className="fas fa-user-plus mr-2"></i>
                            Add New Agent
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="transition-all duration-300">
                    {activeTab === 'list' && (
                        <AgentsList refreshTrigger={refreshTrigger} />
                    )}
                    {activeTab === 'add' && (
                        <AddAgentForm onAgentAdded={handleAgentAdded} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryAgents;