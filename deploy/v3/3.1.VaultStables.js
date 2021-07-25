module.exports = async ({ getChainId, getNamedAccounts, deployments }) => {
    const { deploy, execute } = deployments;
    const chainId = await getChainId();
    let { DAI, deployer, USDC, USDT } = await getNamedAccounts();
    const Manager = await deployments.get('Manager');
    const Minter = await deployments.get('Minter');
    const GaugeProxy = await deployments.get('GaugeProxy');

    if (chainId != '1') {
        const dai = await deployments.get('DAI');
        const usdc = await deployments.get('USDC');
        const usdt = await deployments.get('USDT');
        DAI = dai.address;
        USDC = usdc.address;
        USDT = usdt.address;
    }

    const Vault = await deploy('VaultStables', {
        contract: 'Vault',
        from: deployer,
        log: true,
        args: ['yAxis Stablecoin Canonical Vault', 'CV:S', Manager.address]
    });

    const Gauge = await deploy('VaultStablesGauge', {
        contract: 'LiquidityGaugeV2',
        from: deployer,
        log: true,
        args: [Vault.address, Minter.address, GaugeProxy.address]
    });

    if (Gauge.newlyDeployed) {
        await execute(
            'GaugeController',
            { from: deployer, log: true },
            'add_gauge(address,int128,uint256)',
            Gauge.address,
            0,
            ethers.utils.parseEther('1')
        );
        await execute(
            'Manager',
            { from: deployer, log: true },
            'setAllowedVault',
            Vault.address,
            true
        );
        await execute('Manager', { from: deployer, log: true }, 'setAllowedToken', DAI, true);
        await execute('Manager', { from: deployer, log: true }, 'setAllowedToken', USDC, true);
        await execute('Manager', { from: deployer, log: true }, 'setAllowedToken', USDT, true);
        await execute(
            'Manager',
            { from: deployer, log: true },
            'addToken',
            Vault.address,
            DAI
        );
        await execute(
            'Manager',
            { from: deployer, log: true },
            'addToken',
            Vault.address,
            USDC
        );
        await execute(
            'Manager',
            { from: deployer, log: true },
            'addToken',
            Vault.address,
            USDT
        );
    }
};

module.exports.tags = ['v3', 'gauges'];
